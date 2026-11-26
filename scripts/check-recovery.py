"""Recovery UI acceptance without sending external mail or changing real accounts."""
import argparse
import json
import os
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://localhost:3112')
args = parser.parse_args()
token = 'x' * 43
with sync_playwright() as p:
    options = {'headless': True}
    if os.environ.get('CHROME_PATH'):
        options['executable_path'] = os.environ['CHROME_PATH']
    else:
        options['channel'] = 'chrome'
    browser = p.chromium.launch(**options)
    try:
        for width in [360, 1440]:
            context = browser.new_context(viewport={'width': width, 'height': 900})
            state = {'configured': False, 'reset_status': 503}
            def api(route):
                if route.request.url.endswith('/forgot'):
                    body, status = ({'ok': True}, 200) if state['configured'] else ({'error': 'recovery_unavailable'}, 503)
                else:
                    data = route.request.post_data_json
                    assert data['token'] == token
                    assert len(data['password']) >= 10
                    status = state['reset_status']
                    body = {'ok': True} if status == 200 else {'error': 'platform_temporarily_unavailable'} if status == 503 else {'error': 'invalid_reset_token'}
                route.fulfill(status=status, content_type='application/json', body=json.dumps(body))
            context.route('**/api/platform/password/**', api)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(args.base + '/app/forgot-password', wait_until='networkidle')
            expect(page.get_by_label('Account email')).to_be_visible()
            page.get_by_label('Account email').fill('owner@example.invalid')
            page.get_by_role('button', name='Request password reset', exact=True).click()
            expect(page.get_by_role('status')).to_contain_text('temporarily unavailable')
            state['configured'] = True
            page.get_by_role('button', name='Request password reset', exact=True).click()
            expect(page.get_by_role('status')).to_contain_text('If that account exists')
            page.goto(args.base + '/app/reset-password', wait_until='networkidle')
            expect(page.get_by_role('link', name='Request a reset link', exact=True)).to_be_visible()
            page.goto(args.base + '/app/reset-password?token=' + token, wait_until='networkidle')
            expect(page.get_by_label('New password')).to_be_visible()
            assert 'token=' not in page.url
            assert token not in page.inner_text('body')
            assert page.locator('meta[name="referrer"]').get_attribute('content') == 'no-referrer'
            page.get_by_label('New password').fill('new-test-password')
            page.get_by_role('button', name='Set new password', exact=True).click()
            expect(page.get_by_role('status')).to_contain_text('Try again shortly')
            state['reset_status'] = 400
            page.get_by_role('button', name='Set new password', exact=True).click()
            expect(page.get_by_role('status')).to_contain_text('invalid or has expired')
            state['reset_status'] = 200
            page.get_by_role('button', name='Set new password', exact=True).click()
            expect(page.get_by_role('status')).to_contain_text('All previous sessions have been signed out')
            expect(page.get_by_role('link', name='Sign in with your new password', exact=True)).to_be_visible()
            expect(page.get_by_label('New password')).to_have_count(0)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            context.close()
        print(json.dumps({'recovery_ui': 'passed', 'widths': [360, 1440], 'token_hidden_and_removed_from_url': True, 'provider_unavailable': 'honest', 'transient_expired_and_success_states': 'passed', 'external_email_sent': False}))
    finally:
        browser.close()
