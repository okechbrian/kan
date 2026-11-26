"""Render built pages with Playwright and report HTTP, JS and overflow failures."""
import argparse
import os
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("base", nargs="?", default="http://localhost:3100")
args = parser.parse_args()
routes = ["/", "/manage-sales", "/manage-inventory", "/payment", "/onlineshop", "/business-analytics", "/features", "/supported", "/pricing", "/devices", "/download", "/help", "/privacy", "/privacy-policy", "/terms", "/general-terms", "/merchant-terms", "/account-deletion", "/app/dashboard", "/app/products", "/app/products/bulk-csv", "/app/products/copy-branch", "/app/orders", "/app/reserved-orders", "/app/customers", "/app/expenses", "/app/purchases", "/app/warehouse", "/app/bookings", "/app/production", "/app/notifications", "/app/reports", "/app/shops", "/app/staff", "/app/billing", "/app/settings", "/app/sign-in", "/app/signup", "/app/forgot-password", "/app/reset-password", "/app/business/branch", "/app/business/create", "/stock/batches", "/stock/transfer", "/more/payments", "/app/store", "/shop/demo-duuka", "/discover", "/app/channels", "/app/alerts", "/offline", "/more/install", "/more/hardware", "/app/verticals", "/app/verticals/wave2", "/app/verticals/wave3", "/app/ai", "/app/assistant", "/app/banking", "/app/wallet", "/app/payments", "/support"]
widths = [360, 375, 412, 1440]
failures = []
with sync_playwright() as p:
    options = {"headless": True, "args": ["--disable-features=BackForwardCache", "--renderer-process-limit=3"]}
    if os.environ.get("CHROME_PATH"):
        options["executable_path"] = os.environ["CHROME_PATH"]
    else:
        options["channel"] = "chrome"
    browser = p.chromium.launch(**options)
    try:
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        for width in widths:
            page.set_viewport_size({"width": width, "height": 800})
            for route in routes:
                errors.clear()
                try:
                    response = page.goto(args.base.rstrip("/") + route, wait_until="networkidle")
                    result = page.evaluate("({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),text:document.body.innerText.slice(0,120)})")
                    if response.status != 200 or result["overflow"] or not result["text"] or errors:
                        failures.append({"width": width, "route": route, "status": response.status, **result, "errors": list(errors)})
                except Exception as error:
                    failures.append({"width": width, "route": route, "error": str(error)})
            print(f"Checked {len(routes)} routes at {width}px", flush=True)
    finally:
        browser.close()
if failures:
    for failure in failures:
        print(f"FAIL {failure}")
    raise SystemExit(1)
print(f"Render gate OK: {len(routes) * len(widths)} cases, no HTTP/JS/overflow failures")
