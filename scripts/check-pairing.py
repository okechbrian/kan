"""Cloud branch connection UI, interrupted response, offline PIN and preservation checks."""
import argparse
import hashlib
import json
import os
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://localhost:3113')
args = parser.parse_args()
now = '2026-11-28T09:00:00.000Z'
tables = ['shops', 'users', 'warehouses', 'products', 'customers', 'batches', 'shifts', 'sales', 'sale_lines', 'tenders', 'stock_movements', 'deni_ledger', 'cash_movements', 'expenses']

with sync_playwright() as p:
    options = {'headless': True}
    if os.environ.get('CHROME_PATH'): options['executable_path'] = os.environ['CHROME_PATH']
    else: options['channel'] = 'chrome'
    browser = p.chromium.launch(**options)
    try:
        for width in [360, 1440]:
            context = browser.new_context(viewport={'width': width, 'height': 900})
            state = {'requests': [], 'lost_once': True}
            def api(route):
                if '/workspace' in route.request.url:
                    body = {'account': {'email': 'owner@example.invalid', 'role': 'owner'}, 'business': {'id': 'cloud-business', 'name': 'Cloud Fixture'}, 'shops': [{'id': 'cloud-shop', 'name': 'Cloud Main', 'currency': 'UGX'}]}
                    route.fulfill(status=200, content_type='application/json', body=json.dumps(body))
                    return
                data = route.request.post_data_json
                assert data['shopId'] == 'cloud-shop'
                state['requests'].append(data['deviceId'])
                if state['lost_once']:
                    state['lost_once'] = False
                    route.abort('failed')
                    return
                rows = {table: [] for table in tables}
                rows['shops'] = [{'id': 'cloud-shop', 'business_id': 'cloud-business', 'name': 'Cloud Main', 'shop_code': 'CLOUD-1234', 'currency': 'UGX', 'momo_number': '', 'active': True, 'server_updated_at': now}]
                rows['users'] = [{'id': 'cloud-owner', 'business_id': 'cloud-business', 'shop_id': None, 'name': 'Owner', 'role': 'owner', 'active': True, 'pin_hash': hashlib.sha256(b'duuka-v1:5678').hexdigest(), 'server_updated_at': now}]
                rows['products'] = [{'id': 'cloud-sugar', 'shop_id': 'cloud-shop', 'name': 'Cloud Sugar', 'unit': 'pc', 'buying_price': 4000, 'selling_price': 5000, 'is_fast_mover': True, 'sku_code': '', 'photo_url': '', 'active': True, 'server_updated_at': now}]
                rows['stock_movements'] = [{'id': 'cloud-opening', 'shop_id': 'cloud-shop', 'product_id': 'cloud-sugar', 'user_id': 'cloud-owner', 'type': 'receive', 'qty_delta': 20, 'reason': 'Opening', 'ref_id': '', 'created_at': now}]
                body = {'protocol': 2, 'business': {'id': 'cloud-business', 'name': 'Cloud Fixture', 'created_at': now, 'server_updated_at': now}, 'owner_id': 'cloud-owner', 'shop_id': 'cloud-shop', 'device': {'id': data['deviceId'], 'shop_id': 'cloud-shop', 'name': 'Till', 'token': 'a' * 64}, 'rows': rows, 'new_cursor': now}
                route.fulfill(status=200, content_type='application/json', body=json.dumps(body))
            context.route('**/api/platform/workspace*', api)
            context.route('**/api/platform/pair', api)
            context.route('**/api/sync*', lambda route: route.fulfill(status=503, content_type='application/json', body='{"error":"test network unavailable"}'))
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(args.base + '/app/workspace', wait_until='networkidle')
            expect(page.get_by_role('link', name='Connect till', exact=True)).to_be_visible()
            page.get_by_role('link', name='Connect till', exact=True).click()
            expect(page.get_by_label('Owner PIN', exact=True)).to_be_visible()
            page.get_by_label('Owner PIN', exact=True).fill('5678')
            page.get_by_label('Repeat owner PIN', exact=True).fill('5678')
            page.get_by_role('button', name='Connect till', exact=True).click()
            expect(page.locator('p[role="alert"]')).to_be_visible()
            page.get_by_role('button', name='Connect till', exact=True).click()
            expect(page.get_by_role('heading', name='Till connected', exact=True)).to_be_visible(timeout=15000)
            assert len(state['requests']) == 2 and len(set(state['requests'])) == 1
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.get_by_role('link', name='Unlock connected till', exact=True).click()
            expect(page.get_by_role('button', name='5', exact=True)).to_be_visible()
            for digit in '5678': page.get_by_role('button', name=digit, exact=True).click()
            page.wait_for_url('**/shift/open')
            page.get_by_placeholder('0', exact=True).fill('0')
            page.get_by_role('button', name='Open till', exact=True).click()
            page.wait_for_url('**/sell')
            expect(page.get_by_role('button', name='Cloud Sugar', exact=False).first).to_be_visible()
            page.evaluate('async () => { await navigator.serviceWorker.ready; }')
            for path in ['/sell', '/pin']:
                page.goto(args.base + path, wait_until='networkidle')
            context.set_offline(True)
            for digit in '5678': page.get_by_role('button', name=digit, exact=True).click()
            page.wait_for_url('**/sell')
            page.get_by_role('button', name='Cloud Sugar', exact=False).first.click()
            page.get_by_role('button', name='Charge UGX 5,000', exact=True).click()
            page.get_by_role('button', name='Record cash sale', exact=True).click()
            expect(page.get_by_role('button', name='Receipt', exact=True)).to_be_visible()
            assert page.evaluate("localStorage.getItem('duuka_paired_shop_id')") == 'cloud-shop'
            assert not errors, errors
            context.close()
        print(json.dumps({'branch_pairing': 'passed', 'widths': [360, 1440], 'lost_response_device_id': 'stable', 'cloud_ids': 'preserved', 'offline_pin_and_sale': 'passed', 'external_cloud_writes': False}))
    finally: browser.close()
