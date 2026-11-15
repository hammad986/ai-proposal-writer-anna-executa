import os
import sys
import time
from playwright.sync_api import sync_playwright

def main():
    out_dir = os.path.join(os.getcwd(), 'screenshots', 'v3_0')
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # 1. Studio Win Intel Tab
        print("Navigating to Studio for Win Intel...")
        page.goto('http://127.0.0.1:5173/#/studio/demo_stylehub', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1000)

        intel_btn = page.locator('button:has-text("Win Intel")')
        if intel_btn.count() > 0:
            intel_btn.first.click()
            page.wait_for_timeout(600)

        path_intel = os.path.join(out_dir, '9_studio_win_intel.png')
        page.screenshot(path=path_intel)
        print(f"Saved: {path_intel}")

        # 2. Studio Client Portal Mode
        print("Switching to Client Portal & e-Sign mode...")
        portal_btn = page.locator('button:has-text("Client Portal & e-Sign")')
        if portal_btn.count() > 0:
            portal_btn.first.click()
            page.wait_for_timeout(800)

        path_portal = os.path.join(out_dir, '10_client_portal_esign.png')
        page.screenshot(path=path_portal)
        print(f"Saved: {path_portal}")

        # 3. Studio Executive 1-Pager Mode
        print("Switching to Executive 1-Pager mode...")
        one_pager_btn = page.locator('button:has-text("Executive 1-Pager")')
        if one_pager_btn.count() > 0:
            one_pager_btn.first.click()
            page.wait_for_timeout(800)

        path_one_pager = os.path.join(out_dir, '11_executive_one_pager.png')
        page.screenshot(path=path_one_pager)
        print(f"Saved: {path_one_pager}")

        # 4. RFP Intelligence: Direct URL
        print("Navigating to RFP Intelligence...")
        page.goto('http://127.0.0.1:5173/#/rfp', wait_until='networkidle', timeout=15000)
        page.wait_for_timeout(1000)

        sample_rfp = """# Scope of Work & RFP Specifications
1.0 Mandatory Eligibility
All software must provide automated CI/CD and production containerization.

2.0 Security & Compliance
- Vendor shall enforce TLS 1.3 and AES-256 with audited RBAC.
- Must provide SOC2 Type II compliance verification before launch.

3.0 Implementation Timeline & Commercials
- Delivery deadline is strictly 8 weeks from kickoff.
- Total authorized investment is $45,000 across 3 milestone gates."""

        try:
            textarea = page.locator('textarea')
            if textarea.count() > 0:
                textarea.first.fill(sample_rfp)
                page.click('button:has-text("Shred RFP & Analyze Viability")')
                page.wait_for_timeout(800)

                # Auto-answer with RAG
                auto_ans = page.locator('button:has-text("Auto-Answer with RAG")')
                if auto_ans.count() > 0:
                    auto_ans.first.click()
                    page.wait_for_timeout(1200)
        except Exception as e:
            print("RFP Auto-Answer interaction error:", e)

        path_rfp = os.path.join(out_dir, '12_rfp_qa_auto_responder.png')
        page.screenshot(path=path_rfp)
        print(f"Saved: {path_rfp}")

        browser.close()

    print("\nAll 4 elite screenshot captures completed successfully!")

if __name__ == '__main__':
    main()
