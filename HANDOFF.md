# HANDOFF — current verified state

**Active execution rule (D54, 2026-11-26):** Follow the sequential plan in `IMPLEMENTATION_PLAN.md`. Step 01 is an accepted documented baseline; authenticated reference details remain deferred and unverified. Step 03 is verified deployed. D56 (2026-11-28): defer Step 04 live Resend acceptance; keep it incomplete. Step 05 branch-to-till connection is active, one step at a time. Full Konna parity, one step at a time, and all Uganda/offline safeguards remain required.
**Date:** 2026-11-28
**Project:** Kan (SME Management System)
**Current work:** Step 05 branch-to-till connection, authorized by D56. Resend live acceptance remains deferred.

## Step 05 — implemented; cloud sync acceptance remains open

K05.01 owner-session/tenant authorization; K05.02 owner PIN setup/verification; K05.03 idempotent branch-bound device issuance; K05.04 atomic snapshot/credential installation without echoing cloud rows to outbox; K05.05 offline unlock and sync roundtrip. Acceptance: registered cloud business/shop IDs stay unchanged, wrong tenant/PIN/device binding fails, retries create no duplicate business/shop/device, existing books/unsent work are preserved, paired till works offline. Affected files: pairing API/service, local install helper, workspace connection screen/links, PIN branch selection, tests. Dependencies: existing Neon, account session, Dexie and sync v2; no Resend or schema migration required.

Step 05 implementation: existing cloud business/branch IDs are retained. Only the native PIN owner and scoped device are created when missing; retries reuse the device/token. Local import validates tenant/parent IDs and integer money, commits snapshot and credentials atomically without outbox echo, derives ledger balances and resumes interrupted activation. Other-branch books and unsent changes are preserved and block import. Owner PIN selects the device-bound branch. No schema migration or Resend dependency.

Checks so far: lint, typecheck, production build (105 pages), 236 default tests passed (12 opt-in skipped). Seven new tests cover rollback, interrupted activation, isolation and no outbox echo. Isolated Neon pairing passed with fixture cleanup, including idempotency, wrong PIN/tenant/device denials, second branch and authenticated protocol-v2 pull. The initial run exceeded the 45-second transaction limit; empty sales now skip two unnecessary queries, and the final run passed with the same limit. Headless Chrome at 360/1440px passed lost-response retry with a stable device ID, cloud ID preservation, offline PIN unlock and cash sale. Browser transport is mocked; Neon tests exercise real transactions separately. Existing offline till cash/expense/close/access checks passed. Physical two-device and seven shop-day acceptance remain Steps 08–09. Step 06 has not started; Resend live acceptance stays deferred.

Additional Step 05 regression results: onboarding transport-failure and recovery UI checks passed at 360/1440px; no real email was sent. Final default suite, lint, production build and typecheck passed after expanding snapshot integer checks to tendered cash/change/balance. Supplemental Neon sync was not green: first run passed duplicate replay/isolation but the credit flow returned 503; isolated rerun again passed replay/isolation, then credit/collection/void/close exceeded 180 seconds and cleanup exceeded its hook timeout. This is an outstanding live sync reliability/acceptance gap, not a completed physical two-device check. The generated manifest scopes manual cleanup to those fixture IDs; manual cleanup completed and verified that both generated businesses were absent. Keep Step 05 active until this cloud regression is resolved; do not advance to Step 06.

## Step 04 — implemented; live-delivery sign-off blocked

K04.01 Resend delivery with durable private queue and idempotent retries; K04.02 trusted reset links and generic public responses; K04.03 atomic single-use/expiry/password/session revocation; K04.04 safe recovery UI; K04.05 real provider/inbox acceptance. Affected files: platform service/store, reset routes/pages, Resend adapter, tests and env documentation. No schema change or non-recovery notification feature is planned. Acceptance: actual controlled inbox receives mail; token expires, works once under concurrent redemption, revokes prior sessions, and never appears in public API responses/logs. Missing Resend credentials/sender/inbox block live delivery sign-off, not independent implementation.

Step 03 post-push evidence: 672ab2c is READY/production on Vercel; CI run 45831098728 passed including 215 tests, 252 render cases, offline till and onboarding transport-failure tests. Production live onboarding passed at 360/1440px and fixtures were removed. This supersedes its locally-verified-only heading below.

Step 04 implementation notes: reset token creation, prior-token invalidation, private email queue and audit commit together. Redemption conditionally consumes one unexpired token, changes the password, invalidates other tokens, erases pending private links, revokes all sessions and audits within one serializable transaction. Unknown/expired tokens are rejected before password hashing. Per-account cooldown is one minute with at most five new tokens per hour; retries of a pending/failed request reuse its queue ID. The global unconfigured endpoint returns 503 for every valid email, without looking up the account.

Delivery: a Vercel `waitUntil` task sends only validated password-reset notifications through the fixed HTTPS Resend API; two bounded attempts share the notification's idempotency key. Provider errors are stored as safe codes; failures stay retryable through another reset request. Used/expired/foreign-recipient links are canceled, and sent/canceled queue bodies are erased. `sent` means accepted by Resend, not proof of inbox delivery. There is no recurring cron worker; a failed background task is resumed by a later recovery request. Other notification types are not sent by this worker.

Operational setup: add server-only `RESEND_API_KEY`, `EMAIL_FROM` using a sender verified in Resend, and HTTPS `NEXT_PUBLIC_SITE_URL` to kan-sme production; redeploy after env changes. Disable click/open tracking on the reset sender domain. Do not paste or commit keys. Use a controlled, disposable test account/inbox for live sign-off; do not reset a real merchant password to test. Verify provider acceptance, actual inbox receipt, expiry/reuse rejection and old-session denial before declaring Step 04 complete. `passwordRecovery` on `/api/health` reports configuration presence only.

Provider references: [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [verified domains and tracking](https://resend.com/docs/dashboard/domains/introduction), [Vercel waitUntil for Next.js below 15.1](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package). No stack/framework migration or database schema migration is required.

Step 04 verification before commit:
- Lint, default tests (229 passed; 11 opt-in tests skipped), production build and standalone typecheck after build: passed.
- `KAN_RECOVERY_INTEGRATION=1 npx vitest run __tests__/account-recovery.integration.test.ts`: 5 passed on Neon, covering supersession/throttling, concurrent single use, session revocation, expiry/hour cap, and rollback of password/queue failures. Generated tenants were removed by cleanup assertions. Initial runs encountered database startup/connectivity failures; the final run passed after explicit integration connection deadlines and the platform's transaction-start allowance was increased to ten seconds. Transaction execution remains bounded at thirty seconds.
- Fourteen default mocked-provider/privacy tests passed; these do not establish actual Resend acceptance or inbox receipt.
- Recovery UI browser checks at 360/1440px passed: token hidden and stripped from URL, no-referrer metadata, global unavailable state, transient/expired errors and success/sign-in state. External email sent: false.
- Onboarding transport-failure browser checks and offline cash-sale/expense/close/access workflow passed. Render gate: 63 routes x four widths = 252 cases passed without HTTP/JS/overflow failures.
- Built API: health 200 with passwordRecovery=not_configured, valid recovery request 503 recovery_unavailable, malformed reset token 400 invalid_reset_token. No public tokens or notification IDs returned.

Current blocker: production has neither RESEND_API_KEY nor EMAIL_FROM, and no controlled test inbox has been supplied. The code checkpoint may be committed/deployed with honest 503 behavior; Step 04 is not complete and D56 records the explicit owner reorder to Step 05 while delivery acceptance remains deferred. Post-push CI and deployment evidence belong to the commit's checks. No actual email was sent in this implementation run.

## Step 03 — owner registration and onboarding, verified deployed

K03.01 validated owner credentials/business/first branch; K03.02 atomic tenant creation; K03.03 retry/resume after interruption; K03.04 authenticated cloud workspace landing; K03.05 two-owner isolation and session lifecycle. Acceptance: two independent owners see only their own business/branch; simultaneous or lost-response retry creates one business/account/branch/subscription; failed transaction leaves no partial records; signup/login reach a usable workspace without a local PIN. Existing till remains independent until Step 05. Affected files: platform service/store/validation and routes, AuthForms, cloud workspace page, OwnerBoundary allowlist, regression/integration/browser checks. Dependencies: existing Neon schema/session cookie; no new provider, schema migration or specialist feature required.

Implementation: signup validates strings and atomically commits business, owner, first branch, subscription, audit and session in a serializable transaction. Same verified credentials resume matching registration, including legacy owners with a missing branch/subscription; unique-email/serialization conflicts retry without orphan businesses. The form restores non-password details within the same tab and prevents duplicate submission. Passwords and raw session tokens are never saved in draft storage. Signup and sign-in land at `/app/workspace`, which shows the authenticated cloud business/branches without unlocking local books; sign-out revokes the server session. Existing signed-in users reopening signup return to their workspace. Workspace/session responses are private/no-store. The landing request omits unused billing/quota queries; transient database failures show retryable errors.

Verification before commit:
- `npm run lint`, `npm test` (215 passed; 6 opt-in tests skipped), `npm run build` (103 static pages), and standalone `npm run typecheck` after build: passed.
- `KAN_ONBOARDING_INTEGRATION=1 npx vitest run __tests__/owner-onboarding.integration.test.ts`: 4 passed against Neon; transaction failure rollback, concurrent retries, legacy resume, two-owner isolation, sign-in/out, HttpOnly cookie and non-cached workspace. Cleanup assertions removed generated tenants/accounts.
- `KAN_SYNC_INTEGRATION=1 npx vitest run __tests__/audit-sync.integration.test.ts`: 2 passed on isolated rerun. An earlier run during concurrent cloud traffic timed out with P2028 and failed dependent cash assertions; it was not treated as a pass. No sync runtime code changed.
- `python scripts/check-onboarding.py --base http://localhost:3111`: passed at 360/1440px, including a deliberately lost signup response, draft reload and password exclusion.
- Same command with `--live`: passed with actual Neon-backed registration, workspace, logout and login at both widths. Generated fixtures removed. A prior workspace-load failure prompted the summary-query optimization; final live run passed. Test-only cleanup timeout accommodates slow cross-region connections.
- Render gate: 63 routes x 4 widths = 252 cases passed, including the new workspace; no HTTP/JS/overflow failures. Phone and desktop screenshots inspected.
- Offline till workflow: passed; stock 20 to 18, expected cash UGX 57,000, variance 0, attendant/foreign-shop access denied.

Click-through: open `/app/signup`, enter business, first shop, owner email and password, submit, then inspect `/app/workspace`. Refresh/reopen signup to resume; use Sign out then sign in again. This creates a cloud workspace only. Till pairing stays Step 05; real recovery email stays Step 04. No schema migration, payment provider, local till ledger or new vertical was added.

Post-push acceptance: confirm CI for this commit (includes render/offline/onboarding browser checks), Vercel READY with matching Git SHA, and live onboarding/health. Deployment evidence is available in the commit's GitHub/Vercel checks; a push alone is not sign-off. No Step 04 work is authorized by this implementation.

## Step 01 — accepted baseline; reference verification deferred

K01–K56 in KONNA_PARITY_PLAN.md map delivery groups to code, gaps, dependencies and fixtures. They are not individual tool counts. D54 records owner approval to proceed despite browser failures. Authenticated onboarding was inspected: 30 category entries, optional image, business/phone fields and required branch details. No test business was submitted. Authenticated dashboard and tutorials remain unverified. Expand atomic IDs before each feature build and resolve reference unknowns before K56 sign-off.

Purchases, production, booking payments and warehouse accounting remain partial; existing badges do not prove complete workflows. Prior lint, 212 tests, build and typecheck passed at 1772e98; opt-in Neon and browser evidence below were not rerun for these documentation changes.

## Step 02 — verified production baseline

Inventory K02. Gap: production alias served commit 4bef800, while main is 1772e98 with audited security/sync fixes. Vercel project had no Git link, so pushes did not trigger deployments. Connected existing kan-sme project to okechbrian/kan using Vercel CLI; no new project or credentials created.

Acceptance: production metadata identifies main SHA, CI passes, health and critical negative checks pass, and rollback instructions name an appropriate audited target. Affected files: governance docs and this handoff; deployment metadata is external. Dependencies: existing GitHub/Vercel access and production configuration. Do not begin Step 03 until this baseline is verified.


Production evidence (2026-11-26): Vercel deployment `dpl_Fg8GkX8hJeQ1ngNbhdCcKjjjahim`, `https://kan-5te9zqy66-okechbrian-5599s-projects.vercel.app`, READY and aliased to `https://kan-sme.vercel.app`, reports Git SHA `fe0a561644b0080147dc6359e2388493ff5ac848`. Project metadata confirms GitHub `okechbrian/kan`, production branch `main`. This SHA includes the audited security/sync fixes from bc68fa6. Later documentation-only pushes supersede this baseline SHA without changing application code.

Production checks: `/` 200; `/api/health` 200; database environment configured (not a database connectivity test); workspace GET and sync POST without credentials 401; store order POST 503 `ordering_not_available`; unsigned/unconfigured payment callback 503 `gateway_not_configured`; malformed password-reset request 400 without token. Payments and AI are not configured. No merchant or transaction records were created. Authenticated production onboarding and physical device acceptance remain later work.

Rollback procedure (documented, not executed): inspect the candidate SHA and READY state with `vercel inspect <deployment> --scope okechbrian-5599s-projects`; run `vercel rollback <deployment> --scope okechbrian-5599s-projects --yes`, then repeat health/access checks and verify alias metadata. The first known audited target is the deployment above; older 4bef800/3f773d5 deployments must not be selected because they predate the audit fixes. If this target is itself defective, revert the specific application commit on main and let Git deploy the reviewed fix. A deployment rollback does not restore the database; coordinate any data/migration recovery separately. No rollback drill or database restore was performed here.

CI evidence: [run for fe0a561](https://github.com/okechbrian/kan/actions/runs/45824365677) completed successfully: lint, typecheck, tests, build and the phone/desktop browser plus offline till gate all passed. A fresh reserved-domain missing-account recovery request returned 200 `{ok:true}` without a token; no existing-account email was requested. Documentation changes pass `git diff --check`. Runtime files were unchanged in this step.

## Status

The previous “all Phases 0–7 complete” and live sync sign-off statements are withdrawn. They were inconsistent with the locked plan and unsupported by the implementation audited on 2026-11-26. Historical R0–R11 / parity plans describe intended scope, not proof of delivery.

Implemented remediation:

- Password reset returns the same generic response for existing/missing accounts; reset links are placed only in the private notification queue. No usable token is returned to an unauthenticated caller. A delivery worker/provider is still required to send queued email.
- Sync protocol v2 has an explicit table allowlist and validates tenant IDs, existing row ownership and parent references. Devices, businesses and accounts cannot be written through sync.
- Server pushes use one serializable database transaction and acknowledge specific mutation IDs only after commit. Client errors keep entries pending; retries are idempotent.
- Ledger/outbox writes are atomic in IndexedDB. Sequence numbers and transaction groups preserve write order; bounded pushes allow a backlog of ordinary sale transactions to drain. Stock and deni projections are not synced as catalogue changes.
- Pulls use full, consistent shop snapshots. This avoids cursor races and missed updates to old sales/shifts; it is a deliberate small-shop bandwidth tradeoff. Client pulls are atomic and preserve unsent edits.
- Sales validate the open shift, active user, shop, products and credit customer inside the transaction. Collections cannot race into overcollection; voids reverse every credit tender and cannot double-reverse stock on concurrent requests. The cloud rejects a second device's distinct void reversal.
- Cash expenses post once to both the expense journal and till cash movements; MoMo expenses do not reduce cash. Closing is transactional.
- Local dashboard books require an active owner PIN and use the selected shop. Browser role flags alone do not grant access. Cloud account/session routes continue to enforce their server permissions independently.
- Backup v2 exports every business table and validates imports before clearing books. It supports v1 input, clears newer tables when absent from legacy input, excludes device tokens, and clears cloud identity on restore. Restore outbox entries are regrouped by sale so a large backup can drain in bounded pushes without splitting a sale. Re-pair after restore.
- Online storefronts are explicitly owner-only local previews. The live order API returns 503 with no order ID; public ordering remains Coming soon. It cannot fabricate a successful order or accept attacker-supplied prices.
- Render verification is included in CI, covering phone and desktop widths.

## Verification

- `npm run lint`: passed.
- `npm test`: 212 passed; the two opt-in cloud tests are skipped in the default suite.
- `KAN_SYNC_INTEGRATION=1 npx vitest run __tests__/audit-sync.integration.test.ts`: 2 passed against the configured Neon Postgres. Two tokens upload distinct sales, replay is idempotent, a second shop stays isolated, credit/collection/void/shift-close roundtrip correctly, and all generated test businesses are removed by cleanup assertions.
- Browser render: 62 routes × 360/375/412/1440px = 248 cases passed with no HTTP, JavaScript or overflow failures.
- `scripts/check-till-workflow.py`: passed against the final build with the network disabled. Two items sold, stock 20 → 18; UGX 3,000 cash expense; expected cash UGX 57,000; close variance 0; attendants denied owner dashboard access even with a forged role flag; owner queries exclude another shop's products.
- `npm run build`: passed.
- `npm run typecheck`: passed.

The live integration test uses generated, isolated business/shop IDs and deletes only those IDs. The initial region/network latency exposed per-request pool creation and repeated inserts; sync now reuses a bounded process pool, prefetches references and uses batched inserts. This was programmatic multi-client verification, not a physical shop field test.

## Operational limits / next sign-off

- Git pushes to main now trigger Vercel production deployment; Step 02 metadata and production checks above supersede the earlier deployment-unknown state.
- Programmatic Neon multi-client integration passed. A physical two-device offline → online shop test remains required before field sign-off.
- Step 04 adds the Resend background delivery path; credentials, verified sender and an actual controlled-inbox test are still required. A queued or provider-accepted email is not proof of inbox receipt.
- Public online ordering, native installers, bank/crypto services and a configured AI provider remain outside this remediation.
- Extended local workflow books (purchases/suppliers, bookings, production, reserved/store orders and transfer previews) are backed up but do not have a complete cloud workflow. Do not describe them as synced operational releases.
- Do not add new screens/releases until the remediation is reviewed and the remaining deployment/field checks are complete.

## Run

```text
npm run lint
npm run typecheck
npm test
npm run build
python -m pip install -r scripts/requirements-browser.txt
node node_modules/next/dist/bin/next start -p 3100
# In another terminal while the server runs:
npm run check:render
python scripts/check-till-workflow.py --base http://localhost:3100
```

Browser checks use local Chrome, or the executable supplied in `CHROME_PATH`. The opt-in cloud suite reads `.env.local`, creates only generated `audit-*` fixtures, and asserts that its cleanup removed them.

## MVP readiness assessment — 2026-11-26

The original full platform plan has 14 workstreams (WS-0 through WS-13), including governance, and 12 releases (R0–R11). It does not define an exact count of individual tools. For a grocery-shop MVP, use the following 12 operational groups; this is an assessment grouping, not a claim that the whole platform is complete.

| MVP tool group | Current assessment |
|---|---|
| PIN unlock and owner/attendant roles | Working within the local till |
| Product catalogue and prices | Working |
| Offline counter sales and receipts | Working |
| Cash, manually confirmed MoMo and split payments | Working; no automated collection gateway |
| Customers, deni and collections | Working |
| Receiving and stock adjustments | Working; advanced batch dispensing/warehouse workflows are not included |
| Owner draws and expenses | Working |
| Till close and variance | Working |
| Basic sales, stock, deni and profit-estimate reports | Working locally; scheduled delivery is not included |
| JSON backup and restore | Working |
| Cloud sync and recovery | Implemented; isolated Neon multi-client tests pass; physical two-device field verification and recovery drills remain |
| Owner workspace / branch onboarding | Owner registration/cloud workspace verified in Step 03; cloud-branch to local till pairing remains Step 05, so the combined group remains partial |

Count: 10 working bounded MVP tools, 2 groups still needing completion/operational sign-off. None of these counts is a production-readiness certification.

Full-platform gaps beyond this MVP: public storefront/checkout/delivery/reviews; automated MoMo/card payments and reconciliation/refunds; purchasing tied atomically to stock/payables; completed warehouse transfers; CRM/loyalty; operational bookings/deposits and production/BOM stock accounting; live channel connectors/directory; scheduled notifications/reports and email delivery; enforceable billing/subscription lifecycle; native clients and real hardware integration; specialist vertical workflows; configured AI and licensed banking/crypto partners; monitoring, disaster recovery and a real-shop field test. Existing forms, schemas, helper functions and preview screens do not make these completed tools.

Owner's standing Git preference: commit verified changes and push to main for Vercel deployment. A successful push is not proof that a deployment succeeded.

## Owner scope correction — D52

All Konna tools remain required for Kan. The 12-tool grocery assessment above is an interim readiness view, not the agreed finish line. Full parity must be measured feature by feature against KAN_SCOPE.md and KONNA_PARITY_PLAN.md, with end-to-end evidence and honest partner dependencies. Public reference pages were rechecked on 2026-11-26; authenticated dashboard coverage is not newly verified by that recheck.
