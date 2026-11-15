import os
import sys
import time
from playwright.sync_api import sync_playwright

def main():
    out_dir = os.path.join(os.getcwd(), 'screenshots', 'v3_0')
    os.makedirs(out_dir, exist_ok=True)
    
    routes = [
        ('1_dashboard.png', 'http://127.0.0.1:5173/#/dashboard'),
        ('2_voice_studio.png', 'http://127.0.0.1:5173/#/voice'),
        ('3_proposal_studio_3pane.png', 'http://127.0.0.1:5173/#/studio/demo_stylehub'),
        ('4_template_gallery.png', 'http://127.0.0.1:5173/#/templates'),
        ('5_rfp_intelligence.png', 'http://127.0.0.1:5173/#/rfp'),
        ('6_knowledge_base.png', 'http://127.0.0.1:5173/#/knowledge'),
        ('7_deal_pipeline.png', 'http://127.0.0.1:5173/#/pipeline'),
        ('8_workspace_settings.png', 'http://127.0.0.1:5173/#/settings'),
    ]

    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        for filename, url in routes:
            print(f"Navigating to {url}...")
            try:
                page.goto(url, wait_until='networkidle', timeout=10000)
            except Exception as e:
                print(f"Goto timeout/warn: {e}, waiting 2s...")
                page.wait_for_timeout(2000)
            
            page.wait_for_timeout(1500)
            save_path = os.path.join(out_dir, filename)
            page.screenshot(path=save_path, full_page=False)
            print(f"Saved: {save_path}")

        browser.close()

    print("\nCapture completed successfully!")
    if console_errors:
        print(f"Console errors encountered ({len(console_errors)}):")
        for err in console_errors:
            print(f"  - {err}")
    else:
        print("No browser console errors encountered!")

if __name__ == '__main__':
    main()
