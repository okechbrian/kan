"""Owner onboarding browser acceptance; --live uses isolated Neon fixtures."""
import argparse
import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://localhost:3100')
parser.add_argument('--live', action='store_true')
args = parser.parse_args()
run = uuid.uuid4().hex
emails = [f'onboarding-e2e-{run}-{label}@example.invalid' for label in ['a', 'b']]
password = 'Test-' + uuid.uuid4().hex
root = Path(__file__).resolve().parent.parent
errors = []

with sync_playwright() as p:
    options = {'headless': True}
    if os.environ.get('CHROME_PATH'):
        options['executable_path'] = os.environ['CHROME_PATH']
    else:
        options['channel'] = 'chrome'
    browser = p.chromium.launch(**options)
    try:
        for index, width in enumerate([360, 1440]):
            context = browser.new_context(viewport={'width': width, 'height': 900})
            state = {'signed_in': False, 'calls': 0, 'fail_once': True}
            business = f'Onboarding E2E {run} {index}'
            branch = f'Entebbe Test {index}'

            def api(route):
                path = route.request.url.split('/api/platform/')[-1].split('?')[0]
                status, body = 200, {}
                if path == 'signup':
                    state['calls'] += 1
                    state['signed_in'] = True
                    if state['fail_once']:
                        state['fail_once'] = False
                        route.abort('failed')
                        return
                    body = {'account': {'role': 'owner'}}
                elif path == 'login':
                    state['signed_in'] = True
                elif path == 'logout':
                    state['signed_in'] = False
                elif path == 'session':
                    status = 200 if state['signed_in'] else 401
                elif path == 'workspace':
                    status = 200 if state['signed_in'] else 401
                    body = {'business': {'id': f'b{index}', 'name': business}, 'account': {'email': emails[index], 'role': 'owner'}, 'shops': [{'id': f's{index}', 'name': branch, 'currency': 'UGX'}]}
                else:
                    status = 404
                route.fulfill(status=status, content_type='application/json', body=json.dumps(body))

            if not args.live:
                context.route('**/api/platform/**', api)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(args.base + '/app/signup', wait_until='networkidle')
            expect(page.get_by_role('heading', name='Create your workspace')).to_be_visible()
            page.get_by_label('Business name', exact=True).fill(business)
            page.get_by_label('First shop / branch name', exact=True).fill(branch)
            page.get_by_label('Email', exact=True).fill(emails[index])
            page.get_by_label('Password', exact=True).fill(password)
            page.reload(wait_until='networkidle')
            expect(page.get_by_label('Business name', exact=True)).to_have_value(business)
            expect(page.get_by_label('First shop / branch name', exact=True)).to_have_value(branch)
            expect(page.get_by_label('Password', exact=True)).to_have_value('')
            assert 'password' not in page.evaluate("sessionStorage.getItem('kan.signup.v1')")
            page.get_by_label('Password', exact=True).fill(password)
            print(f'Checking registration at {width}px', flush=True)
            if args.live:
                with page.expect_response(lambda r: r.url.endswith('/api/platform/signup'), timeout=65000) as registration:
                    page.get_by_role('button', name='Create workspace', exact=True).click()
                result = registration.value
                print(json.dumps({'signup_status': result.status}), flush=True)
                assert result.status == 201, 'Registration did not complete'
            else:
                page.get_by_role('button', name='Create workspace', exact=True).click()
            if not args.live:
                expect(page.get_by_role('status')).to_contain_text('Connection interrupted')
                page.get_by_role('button', name='Create workspace', exact=True).click()
            page.wait_for_url('**/app/workspace', timeout=90000)
            if not args.live:
                assert state['calls'] == 2
            page.get_by_role('heading', name=business, exact=True).or_(page.get_by_role('heading', name='Could not load your workspace')).wait_for(timeout=90000)
            if page.get_by_role('heading', name='Could not load your workspace').is_visible():
                print('Retrying workspace after a transient load failure', flush=True)
                page.get_by_role('button', name='Try again', exact=True).click()
            expect(page.get_by_role('heading', name=business, exact=True)).to_be_visible(timeout=90000)
            expect(page.get_by_role('heading', name=branch, exact=True)).to_be_visible()
            expect(page.get_by_text('Currency: UGX', exact=True)).to_be_visible()
            expect(page.get_by_role('heading', name='Owner access required')).to_have_count(0)
            assert not page.evaluate("sessionStorage.getItem('kan.signup.v1')")
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(Path(tempfile.gettempdir()) / f'kan-onboarding-{width}.png'), full_page=True)
            page.goto(args.base + '/app/signup', wait_until='networkidle')
            page.wait_for_url('**/app/workspace', timeout=90000)
            page.get_by_role('button', name='Sign out', exact=True).click()
            page.wait_for_url('**/app/sign-in', timeout=90000)
            page.goto(args.base + '/app/workspace', wait_until='networkidle')
            expect(page.get_by_role('heading', name='Sign in to your workspace')).to_be_visible(timeout=90000)
            page.goto(args.base + '/app/sign-in', wait_until='networkidle')
            page.get_by_label('Email', exact=True).fill(emails[index])
            page.get_by_label('Password', exact=True).fill(password)
            page.get_by_role('button', name='Sign in', exact=True).click()
            page.wait_for_url('**/app/workspace', timeout=90000)
            expect(page.get_by_role('heading', name=business, exact=True)).to_be_visible(timeout=90000)
            context.close()
        assert not errors, errors
        print(json.dumps({'onboarding': 'passed', 'mode': 'live' if args.live else 'mocked transport failure', 'widths': [360, 1440], 'draft_resume': 'passed', 'password_not_persisted': 'passed', 'sign_in_out': 'passed', 'page_errors': errors}))
    finally:
        browser.close()
        if args.live:
            subprocess.run(['node', '--env-file=.env.local', 'scripts/cleanup-onboarding.cjs', *emails], cwd=root, check=True)
