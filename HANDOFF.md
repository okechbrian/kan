# HANDOFF — current verified state

**Date:** 2026-11-26
**Project:** Kan (SME Management System)
**Current work:** D51 audit remediation, explicitly authorized by the user. No new feature release is unlocked.

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

- Changes in this workspace are not deployed automatically. The existing Vercel deployment has not been changed by this task.
- Programmatic Neon multi-client integration passed. A physical two-device offline → online shop test remains required before field sign-off.
- Email delivery needs a real worker/provider; a queued password-reset notification is not a sent email.
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
| Owner workspace / branch onboarding | Partial; cloud accounts and local PIN till are not one complete onboarding/branch-management flow |

Count: 10 working bounded MVP tools, 2 groups still needing completion/operational sign-off. None of these counts is a production-readiness certification.

Full-platform gaps beyond this MVP: public storefront/checkout/delivery/reviews; automated MoMo/card payments and reconciliation/refunds; purchasing tied atomically to stock/payables; completed warehouse transfers; CRM/loyalty; operational bookings/deposits and production/BOM stock accounting; live channel connectors/directory; scheduled notifications/reports and email delivery; enforceable billing/subscription lifecycle; native clients and real hardware integration; specialist vertical workflows; configured AI and licensed banking/crypto partners; monitoring, disaster recovery and a real-shop field test. Existing forms, schemas, helper functions and preview screens do not make these completed tools.

Owner's standing Git preference: commit verified changes and push to main for Vercel deployment. A successful push is not proof that a deployment succeeded.
