# Locked plan — Kan

**Active execution rule (D54, 2026-11-26):** Follow the sequential plan in `IMPLEMENTATION_PLAN.md`. Step 01 is an accepted documented baseline; authenticated reference details remain deferred and unverified. Step 03 is verified deployed. Step 04 account recovery is active with Resend; live delivery requires configured credentials, a verified sender and a controlled inbox. Step 05 is not started. Full Konna parity, one step at a time, and all Uganda/offline safeguards remain required.
**Date locked:** 2026-11-24 (supersedes the Duuka-only plan of 2026-09-02)
**Authoritative scope:** [KAN_SCOPE.md](KAN_SCOPE.md) · **Decisions:** [DECISIONS.md](DECISIONS.md) D40–D47
**Read with:** `PRODUCT_VISION.md`, `DOMAIN.md`, `UI_MAP.md`, `SYNC.md`, `IMPLEMENTATION_PLAN.md`.

---

## One sentence

An Uganda-first commerce platform, built on a phone till that sells with no internet, where one owner can run many shops and later open an online store — with banking, crypto and AI only through partners.

## What changed on 2026-11-24

| Was (Duuka) | Now (Kan) |
|---|---|
| Offline grocery till, one owner, many shops | Same core **plus** platform, storefront, payments, analytics, clients |
| "Not an online store, not SaaS, no AI" (D5/D30) | Superseded by D40–D47; those features are scoped, not built yet |
| One Next.js PWA | One Next.js app now; native/desktop clients from R8 |
| No billing chrome | Subscriptions and quotas from R2 |

The offline till engine, integer money, PIN roles, `shop_id` on every row, deni rules and close formula are **unchanged**. See `DOMAIN.md` and `SYNC.md`.

## Product target reaffirmed — D52

Full Konna tool coverage is the agreed target. The 12-tool grocery MVP assessment is an interim milestone, not a reduction of scope. Use KAN_SCOPE.md and KONNA_PARITY_PLAN.md for the full feature inventory. Delivery remains sequential; completion requires working end-to-end flows and recorded acceptance evidence for every capability. Partner-dependent capabilities remain required integrations, never simulated tools.

## Right now — audit remediation (D51, 2026-11-26)

The user authorized fixing all findings in the project audit, starting with critical security, then sync and money correctness. This is the current work across existing code. The historical R1-only editing restriction does not block these fixes. No new feature release, deployment or field-test sign-off is implied.

Required gates: lint, typecheck, full regression tests, production build, phone/desktop render checks and an offline till workflow check. Cloud and two-device sign-off must be supported by new evidence; previous completion claims are withdrawn. Public storefront ordering stays **Coming soon** and its API must reject orders honestly until the complete cloud flow is built and verified.

## Original first release (R0/R1, historical)

1. **R0** — re-lock docs, `git init` + push, brand.
2. **R1** — public marketing site at a temporary Vercel URL + **honest** dashboard shell:
   - Marketing: `/`, `/features`, `/supported`, `/pricing`, `/devices`, `/help`, `/privacy`, `/terms`, `/merchant-terms`, `/account-deletion`
   - App: `/app` and sub-pages for dashboard, products, orders, customers, reports, shops, staff, billing, settings
   - Till: unchanged at `/pin`, `/sell`, `/stock`, `/customers`, `/more`; the old `/` redirect moves to `/pos`
   - Every unbuilt panel says `Coming soon` or `With partner`. **No fake numbers, no fake testimonials.**
3. Gates: lint, typecheck, test, build, built-site render check at 360/375/412px.

## Shape

```
Shopkeeper phone (offline till, Dexie)  ──outbox──> Cloud (Postgres, many shops)
Owner laptop / phone (dashboard)       <──pull────  Cloud
Customer browser (online store)        ──order───>  Cloud         [R5+]
Native Android/iOS, Windows desktop                       [R8+]
```

## Scope boundaries

- **In the full scope** (`KAN_SCOPE.md`): platform/auth/billing, catalogue depth, warehouses & transfers, purchasing, payments, online store, social store, marketplace, CRM/loyalty, bookings, analytics, AI, vertical packs, native/desktop clients, hardware, legal/support/ops.
- **Out until further decision:** EFRIS/URA, payroll, multi-currency, crypto custody, in-house banking.
- **Never:** fake data, silent deletes, blocking a sale on network failure, floating-point money.

## Build order (do not reorder)

R0 → R1 → R2 → R3 → R4 → R5 → R6 → R7 → R8 → R9 → R10 → R11. See `IMPLEMENTATION_PLAN.md`.

## Success for R1

A stranger can open the temporary Vercel URL, understand what Kan is, see which parts exist and which are planned, and reach every legal/support page — with no invented proof and no broken layout on a phone.
