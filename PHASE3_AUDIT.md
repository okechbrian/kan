# Phase 3 audit — 2026-09-05

Against `IMPLEMENTATION_PLAN.md` Phase 3 and `UI_MAP.md` pay sheet + deni.

## Plan checklist

| Required | Before audit | After audit |
|---|---|---|
| Tenders: cash, mtn_momo, airtel_money, credit | Yes in `recordSale` | Yes |
| Split pay sums to total | Yes in lib | Yes |
| Customer pick for credit | Picker existed | Yes + cannot add credit without customer |
| Collect deni | List + modal | List, `/customers/[id]` ledger, collect |
| Shop MoMo number at pay time | Passed from shop | Shown on MTN/Airtel |
| Test: credit increases balance | Yes | Yes |
| Test: collection decreases | Yes | Yes |
| Test: 10k cash + 5k momo on 15k | Yes (3× sugar 5k) | Yes |
| Cannot complete credit without customer | Lib yes; UI could skip picker | Both |

## Bugs vs the spec (fixed)

1. **Cash change was dead.** Split-style modal set `amountTendered === amount` and capped input at remaining. You could not tender UGX 20,000 on a UGX 1,500 soda. UI map: chips + change + `Record cash sale`.
2. **Simple cash/MoMo/credit required an extra “Add” tap** then Confirm. Spec is one-shot per method. **Split** is the only multi-tender mode.
3. **No Split tab.** Spec: `Cash` `MTN` `Airtel` `Credit` `Split`.
4. **Wrong confirm copy.** Spec: `Record cash sale` / `I received MoMo` / `Put on deni`.
5. **Credit tender could be added with no customer**, then confirmed after switching tab — lib would throw. UI must refuse.
6. **No `/customers/[id]`** (ledger + collect). List had no **Show all** / add customer.
7. **Collection could exceed balance** (test even allowed −5,000). Cap and reject.
8. **Today** on More showed cash only. Spec: breakdown cash / MTN / Airtel / credit.

## Not Phase 3

- Receive / adjust / void / draw (Phase 4)
- Close till (Phase 5)
- Shop settings editor (MoMo number still comes from the shop row)
