# Phase 5 audit — 2026-09-06

Against `IMPLEMENTATION_PLAN.md` Phase 5, `UI_MAP.md` close till + reports, `DOMAIN.md` evening close.

## Plan checklist

| Required | Before audit | After audit |
|---|---|---|
| Expected cash formula | Duplicated on close page; missed expenses | Shared `expectedCash()` |
| Counted cash input | Yes | Yes |
| Variance Exact / Short / Over | Hidden when counted = 0 | Live including 0 |
| Close shift; cannot sell until open | Close yes; sell already redirects | `closeShift()` + same redirect |
| Reports: today, deni, profit, low stock | Today + profit; deni/stock are tabs | Who owes on More |
| Fixture 50k + 80k − 10k = 120k | Pure math / circular Dexie | `expectedCash` + `closeShift` |
| After close: Till closed + Open again | Auto-jump to PIN | Rest screen |

## Bugs vs the spec (fixed)

1. **Close page did not use `expectedCash()`.** Formula omitted expenses and filtered sales by calendar day as well as shift (wrong if the till is still open after midnight).
2. **No `closeShift()`.** Tests wrote Dexie by hand.
3. **Variance hidden at counted 0.**
4. **No “Till closed / Open again” screen.**
5. **More missing Who owes.**
6. **Backup restore available to attendants.** Spec: export both, import owner.
