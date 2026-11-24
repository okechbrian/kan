# Phase 1 review (planning chat, 2026-09-02)

**Signed off: 2026-09-05.** Punch list P1+P2 done. `tsc --noEmit` clean. Vitest **16/16 passed**.

## Verdict

**Phase 1 is done.** Phase 2 (PIN + shift + cash sell) may start. Do not skip to sync or shop 2.

## What matches the spec

| Requirement | Status |
|---|---|
| Next.js + TS + Tailwind + Dexie in this folder | Yes |
| Integer UGX helpers + tests | Yes (`src/lib/money.ts`, `__tests__/money.test.ts`) |
| `Business` + `Shop` + `shop_id` on business tables | Yes |
| Seed: Demo Duuka, `DUKA-DEMO`, PIN `1234`, 8 grocery SKUs and prices | Yes, prices match the plan |
| Backup export/import JSON + round-trip test | Logic yes (`src/lib/backup.ts`, db test) |
| No marketing site, no WhatsApp, no EFRIS, no shop-2 UI | Yes |

## What the builder claimed that is not true

1. **“Seed auto-runs on first visit”** — [`src/app/page.tsx`](src/app/page.tsx) is a static heading. It does not call `seedDemoData()`. Opening `/` does nothing to IndexedDB.
2. **Backup UI** — [`BackupButton.tsx`](src/components/BackupButton.tsx) exists and is **never imported**. There is no way to tap export/import in the app.
3. **Tests / typecheck** — not run. `node_modules` is absent. Proxy blocked npm on the builder and on this machine.

Phase 1 verify bar was: `tsc` clean, money tests, seed insert, export/import. That bar has not been evidenced.

## Punch list (fix these, then stop)

### P1 — must before Phase 1 is done

1. **Wire the skeleton screen.** Client home page that:
   - calls `seedDemoData()` on mount
   - lists the 8 products (name, sell price via `ugx()`, qty)
   - shows shop code `DUKA-DEMO`
   - mounts `<BackupButton />`
2. **Add `.gitignore`:** `node_modules`, `.next`, `.env*`, `tsconfig.tsbuildinfo`, coverage, OS junk. Do not commit `node_modules`.
3. **Human (or builder on a clean network):**  
   `npm install && npm run typecheck && npm run test && npm run dev`  
   Paste the three command outputs. Without that, Phase 1 stays open.

### P2 — cheap, do now so Phase 6 does not lie

4. **Opening stock must be a movement.** Seed currently writes `stock_qty` only. Sync rule is: qty is the sum of `stock_movements`. For each seeded product, insert a `StockMovement` `{ type: "receive", qty_delta: opening, reason: "opening stock" }` (or keep qty as cache **and** write the movement).
5. **Add `devices` table** now (empty). `LOCKED_PLAN.md` / `DOMAIN.md` include `Device`. Adding it in Phase 6 forces a Dexie version bump on real shops.
6. **`ugx()` must not depend on locale.** `toLocaleString("en-UG")` passed on this PC; it can fail in CI. Format with a fixed thousands separator in code.

### P3 — Phase 2, not now

7. Move PIN hash/verify to `src/lib/pin.ts`. SHA-256 of `"1234"` with no salt is a 10 000-guess table. Salt per user before anyone logs in for real.
8. Type `BackupData` (drop `any[]`). Reject import if `version !== 1`.
9. Export `hashPin` / `verifyPin` for the PIN screen.

## Do not do in this patch

- `/pin`, `/sell`, `/setup` (Phase 2)
- Postgres, sync, second shop
- Pretty landing page

## After punch list

Reply with:

- `npm run typecheck` output
- `npm run test` output
- Screenshot or description of `/` showing 8 products + backup buttons

Then planning chat signs Phase 1 and releases Phase 2 only.
