# Phase 4 audit — 2026-09-06

Against `IMPLEMENTATION_PLAN.md` Phase 4, `UI_MAP.md` stock/receive/adjust/draw, `DOMAIN.md` roles and void.

## Plan checklist

| Required | Before audit | After audit |
|---|---|---|
| Receive stock + last buying price | UI yes, one SKU, inline Dexie | Shared `receiveStock()`, multi-line, then back to `/stock` |
| Adjust counted qty + reason | UI yes; tests copied Dexie | Shared `adjustStock()` |
| Owner draw | **Missing** | `/more/draw` + `recordDraw` |
| Owner void (stock + deni reverse) | Lib only, **no UI** | `/more/sales` + owner-only `voidSale` |
| Test: receive +10 | Circular (not calling till code) | Calls `receiveStock` |
| Test: void restores | Called `voidSale` | Same + owner check |
| Test: draw reduces expected cash | **Missing** | `expectedCash` fixture |
| Owner-only receive/adjust/edit | **No** — attendant saw Receive/Add/Edit | Role check in lib + UI |
| Attendant can still view stock | Yes | Yes |

## Bugs vs the spec (fixed)

1. **No owner draw.** Phase 4 required cash leaving the till with a reason.
2. **No void screen.** `voidSale` existed; an owner could not tap it.
3. **Receive/adjust/product edit were not owner-only.** Spec: attendant cannot change prices, receive, or adjust.
4. **Receive was one product and stayed on the page.** Spec: add lines, `Add to stock`, return to `/stock`.
5. **Receive/adjust ignored `?product=`** from product detail.
6. **Tests for receive/adjust re-wrote Dexie** instead of calling the till functions.
7. **No expected-cash helper**, so draw could not be verified as specified.

## Not Phase 4

- Close till / variance (Phase 5)
- Users & PINs, shop settings, sync (later)
- Receive/ReceiveLine extra tables (stock movements + supplier on the receive batch are enough for v1)
