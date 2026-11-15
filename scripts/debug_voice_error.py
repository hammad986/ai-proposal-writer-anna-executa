from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
    page.on('console', lambda msg: print(f"CONSOLE {msg.type}: {msg.text}") if msg.type in ['error', 'warn'] else None)
    
    page.goto('http://127.0.0.1:5173/#/voice')
    page.wait_for_timeout(2000)
    browser.close()
