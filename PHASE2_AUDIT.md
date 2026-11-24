# Phase 2 audit — 2026-09-05

Against `IMPLEMENTATION_PLAN.md` Phase 2 and `UI_MAP.md` (PIN, open shift, sell cash). Planning chat then patched the gaps listed under **Fixed in this audit**.

## Plan checklist

| Required | Before audit | After audit |
|---|---|---|
| PIN screen | Partial | Yes |
| Open shift with float | Yes | Yes |
| Sell: fast-mover grid, cart, cash, change | Yes (cash only — correct for Phase 2) | Yes |
| Stock decreases on sale | Yes in UI; tests did not call UI code | Shared `recordCashSale()` + tests |
| Today totals | **Missing** (More was Lock only) | More page shows today |
| Test: cash sale reduces stock | Weak (re-implemented sale in the test) | Uses `recordCashSale` |
| Test: change = tendered − total | Weak (wrote the number into Dexie) | Uses `recordCashSale` |
| Cannot sell without open shift | Yes (redirect) | Yes |
| Offline sale (no fetch) | Yes | Yes |
| MoMo / deni / split | Correctly **not** built | Still Phase 3 |

## Bugs found (would fail a real till)

1. **Owner PIN bound an empty shop.** Seed owner has `shop_id: null` (business-level, per `DOMAIN.md`). PIN did `setSession(user.id, user.shop_id ?? "")`. Sell then queried products for `shop_id === ""` → **empty grid**. Demo PIN `1234` could not sell.
2. **PIN auto-submitted at 4 digits.** Spec is 4–6. A 5- or 6-digit PIN could never be finished.
3. **`buying_price_snapshot` written as `0`.** Profit estimate in Phase 5 would be a lie.
4. **Cart sheet and bottom nav both `bottom-0` / `z-30`.** Charge button sat on the nav.
5. **Search hid non-fast-movers** (`others` only if `!search`). Hidden today because all 8 seed items are fast movers.
6. **No “This is not my shop”** wipe (UI map).
7. **Today totals** listed in Phase 2, not implemented.
8. **Sale tests were circular** — they copied the Dexie writes instead of calling the till function.

## Not Phase 2 (leave)

- `/setup` create/join shop (Phase 6)
- MoMo / Airtel / Credit / Split (Phase 3)
- Stock receive/adjust (Phase 4)
- Close till (Phase 5)
- Per-user PIN salt (pepper added; full salt-per-user can wait)
- Service worker

## How to tap (after patch)

1. `npm run dev` → `http://localhost:3000`
2. PIN `1234` (OK if you use 4 digits; auto-unlocks on match)
3. Open till, float e.g. `50000`
4. Tap Sugar → Charge → Exact or `10000` → Record cash sale
5. More → see today’s total
6. DevTools offline → sell again (must still work)
