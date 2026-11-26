"""Isolated browser smoke test. Requires Python Playwright and local Chrome."""
import argparse
import json
import os
import re
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description="Check offline cash sale, expense, close, and owner dashboard isolation")
parser.add_argument("--base", default="http://localhost:3100")
args = parser.parse_args()

with sync_playwright() as p:
    options = {"headless": True}
    if os.environ.get("CHROME_PATH"):
        options["executable_path"] = os.environ["CHROME_PATH"]
    else:
        options["channel"] = "chrome"
    browser = p.chromium.launch(**options)
    context = browser.new_context(viewport={"width": 360, "height": 800})
    # Exercise local setup without creating a real cloud tenant.
    context.route("**/api/pair/create", lambda route: route.fulfill(status=503, content_type="application/json", body='{"error":"Cloud not configured"}'))
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    def go(route):
        page.goto(args.base + route, wait_until="networkidle")

    def books():
        return page.evaluate("""async () => {
          const database = await new Promise((resolve,reject) => {const request=indexedDB.open('duuka');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
          const result={};
          for (const name of ['shops','users','products','sales','shifts','tenders','cash_movements','outbox']) {
            result[name]=await new Promise((resolve,reject)=>{const request=database.transaction(name).objectStore(name).getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
          }
          database.close(); return result;
        }""")

    go("/setup")
    # Inspect the rendered state before taking actions.
    expect(page.get_by_role("button", name="Create new shop", exact=True)).to_be_visible()
    page.get_by_role("button", name="Create new shop", exact=True).click()
    page.get_by_placeholder("Your name", exact=True).fill("Audit Owner")
    page.get_by_placeholder("Shop name (e.g. Entebbe Main)").fill("Audit Local Shop")
    page.get_by_placeholder("Owner PIN (4-6 digits)").fill("5678")
    page.get_by_role("button", name="Create shop", exact=True).click()
    expect(page.get_by_text("Shop created", exact=True)).to_be_visible()
    page.get_by_role("button", name="Continue to till").click()
    for digit in "5678":
        page.get_by_role("button", name=digit, exact=True).click()
    page.wait_for_url("**/shift/open")
    page.get_by_placeholder("0", exact=True).fill("50000")
    page.get_by_role("button", name="Open till", exact=True).click()
    page.wait_for_url("**/sell")

    go("/app/products")
    page.get_by_label("Product name", exact=True).fill("Audit Sugar")
    page.get_by_label("Buy (UGX)", exact=True).fill("4000")
    page.get_by_label("Sell (UGX)", exact=True).fill("5000")
    page.get_by_label("Opening qty", exact=True).fill("20")
    page.get_by_role("button", name="Save product", exact=True).click()
    expect(page.get_by_text("Product added.", exact=True)).to_be_visible()

    page.evaluate("async () => { await navigator.serviceWorker.ready; }")
    page.reload(wait_until="networkidle")
    for route in ["/sell", "/app/expenses", "/shift/close", "/app/orders", "/app/reports", "/app/products", "/pin"]:
        go(route)
    go("/sell")
    context.set_offline(True)
    page.get_by_role("button", name=re.compile("Audit Sugar")).first.click()
    page.get_by_role("button", name="Increase Audit Sugar", exact=True).click()
    page.get_by_role("button", name="Charge UGX 10,000", exact=True).click()
    page.get_by_role("button", name="Record cash sale", exact=True).click()
    page.get_by_role("button", name="Receipt", exact=True).click()
    expect(page.get_by_role("button", name="Close receipt", exact=True)).to_be_visible()
    page.get_by_role("button", name="Close receipt", exact=True).click()
    state = books()
    assert len(state["sales"]) == 1 and state["sales"][0]["total"] == 10000
    assert state["products"][0]["stock_qty"] == 18
    assert any(row["table"] == "sales" and row["synced_at"] is None for row in state["outbox"])
    sale_id = state["sales"][0]["id"]
    sale_events = [row for row in state["outbox"] if row["row_id"] == sale_id or json.loads(row["payload"]).get("sale_id") == sale_id or json.loads(row["payload"]).get("ref_id") == sale_id]
    assert len(sale_events) >= 4
    assert len({row.get("batch_id") for row in sale_events}) == 1 and sale_events[0].get("batch_id")

    go("/app/expenses")
    page.get_by_label("Amount (UGX)", exact=True).fill("3000")
    page.get_by_label("Note", exact=True).fill("Audit transport")
    page.get_by_role("button", name="Save expense", exact=True).click()
    expect(page.get_by_text("Expense recorded.", exact=True)).to_be_visible()
    go("/shift/close")
    expect(page.get_by_text("UGX 57,000", exact=True)).to_be_visible()
    page.locator("input").fill("57000")
    page.get_by_role("button", name="Close till", exact=True).click()
    expect(page.get_by_text("Till closed", exact=True)).to_be_visible()
    state = books()
    assert state["shifts"][0]["status"] == "closed"
    assert state["shifts"][0]["expected_cash"] == 57000 and state["shifts"][0]["variance"] == 0

    # Fixtures for authorization tests stay in this disposable browser profile.
    page.evaluate("""async () => {
      const database=await new Promise(resolve=>{const request=indexedDB.open('duuka');request.onsuccess=()=>resolve(request.result);});
      const read=name=>new Promise(resolve=>{const request=database.transaction(name).objectStore(name).getAll();request.onsuccess=()=>resolve(request.result);});
      const owner=(await read('users'))[0],shop=(await read('shops'))[0],product=(await read('products'))[0];
      await new Promise((resolve,reject)=>{const tx=database.transaction(['users','products'],'readwrite');tx.objectStore('users').add({...owner,id:'audit-attendant',role:'attendant',shop_id:shop.id});tx.objectStore('products').add({...product,id:'audit-foreign-product',shop_id:'foreign-shop',name:'Foreign Secret Product'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      database.close();localStorage.setItem('audit-owner-id',owner.id);localStorage.setItem('duuka_user_id','audit-attendant');localStorage.setItem('duuka_role','owner');
    }""")
    for route in ["/app/products", "/app/orders", "/app/reports", "/app/expenses"]:
        go(route)
        expect(page.get_by_text("Owner access required", exact=True)).to_be_visible()
        assert page.get_by_role("button", name="Save product", exact=True).count() == 0
    page.evaluate("localStorage.setItem('duuka_user_id',localStorage.getItem('audit-owner-id'))")
    go("/app/products")
    expect(page.get_by_text("Audit Sugar", exact=True)).to_be_visible()
    expect(page.get_by_text("Foreign Secret Product", exact=True)).to_have_count(0)
    assert not errors, errors
    print(json.dumps({"offline_cash_sale": "passed", "stock": 18, "cash_expense": "passed", "expected_cash": 57000, "close_variance": 0, "attendant_dashboard_denial": "passed", "selected_shop_isolation": "passed", "page_errors": errors}))
    browser.close()
