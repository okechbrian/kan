# Implementation plan

**Active product:** **Kan** — Uganda-first commerce platform built on the offline till. Full scope: `KAN_SCOPE.md`. Decisions: `DECISIONS.md` D40–D47.
**Historical below:** the original Duuka tracks A/B/C are kept as the specification of the **till engine only**. They are not the active product scope.

Read with: `KAN_SCOPE.md`, `LOCKED_PLAN.md`, `DECISIONS.md`, `DOMAIN.md`, `UI_MAP.md`, `SYNC.md`, `AGENTS.md`.

Builder agent: implement **one release at a time**. Current work is D51 audit remediation of existing code; the R0/R1-only builder commands below are historical and do not prohibit these fixes. New releases remain gated.

---

## Kan program (ACTIVE)

| Release | Build | Verify / exit |
|---|---|---|
| **R0** | Re-lock docs (done), `git init` + remote, ESLint config, CI, env template | Repo pushed; docs no longer contradict the target |
| **R1** | Public marketing site + honest dashboard shell; move `/` redirect to `/pos`; Vercel temp domain | All routes 200 anonymously; 0px overflow at 360/375/412; no fabricated data; lint/typecheck/test/build/render gate green |
| **R2** | Tenancy, auth, RBAC, onboarding, subscriptions/quotas, notifications, audit | Second tenant isolated; quotas enforced |
| **R3** | Port the 49 till tests; catalogue, inventory depth, warehouses, transfers, barcode, receipts | Offline sale still works; multi-branch stock correct |
| **R4** | Payments: cash, MTN/Airtel MoMo, bank/card adapters, split, reconciliation | Tenders sum to total; idempotent webhooks; no card data stored |
| **R5** | Online store: storefront, sync, cart/checkout, delivery, reviews, invoices | Real buyer orders from a shared link |
| **R6** | Social store, marketplace connector, Discover Merchants | One product edit reflects on all channels |
| **R7** | Analytics, scheduled reports, alerts | Figures match a known ledger fixture |
| **R8** | Android/iOS/Windows, offline sync, hardware | Offline sale on device, then sync |
| **R9** | Vertical waves 1–3 (16 businesses) | Each pack has a testable workflow |
| **R10** | Guardrailed AI; banking/crypto via licensed partner only | Tenant isolation proven; no regulatory exposure |
| **R11** | Support, DR, security review, app-store release | Live, monitored, backed up |

### R1 build checklist

- [ ] `git init`, add remote `okechbrian/kan`, first commit
- [ ] ESLint config; CI running lint/typecheck/test/build on push
- [ ] `.env.example`: `NEXT_PUBLIC_SITE_URL`
- [ ] `/` marketing home + `/features`, `/supported`, `/pricing`, `/devices`, `/help`, legal pages
- [ ] `/app` shell + 9 sub-pages, all honest empty states
- [ ] `/pos` receives the old till redirect; `/pin`, `/sell`, `/stock`, `/customers`, `/more` untouched
- [ ] Built-site render check at 360/375/412; zero overflow; anonymous 200 on every public route

---

## HISTORICAL — Duuka track specification (till engine only)

The sections below describe the offline till that is reused in R3. Their stack note (one PWA, no billing, no public signup) is superseded by `KAN_SCOPE.md`; their domain rules and money tests are not.

---

## Track A (recommended) — Offline PWA till

### Outcome

An Android phone is the till for **one shop**. It sells with no internet. The owner can open the same app on a laptop (phase 6) and later add **shop 2** (phase 7). Each till is bound to one shop. Stock and deni never mix across shops in v1.

### Stack

- Next.js (App Router) + TypeScript + Tailwind
- Dexie / IndexedDB for all business data
- Service worker for offline shell
- PIN auth (hashed, local)
- Integer UGX helpers
- Deploy shell to Vercel later; local `npm run dev` is enough for field test on the same Wi-Fi

### App screens (v1)

| Route | Role | Purpose |
|---|---|---|
| `/` | both | Redirect to setup, pin, or sell |
| `/setup` | both | Create shop or join with shop code |
| `/pin` | both | Unlock |
| `/shift/open` | both | Enter float |
| `/shift/close` | both | Count cash, variance |
| `/sell` | both | Fast-mover grid + search + cart + pay |
| `/customers` | both | List, add, deni balance |
| `/customers/[id]` | both | Ledger + collect |
| `/stock` | both | Quantities, low stock |
| `/stock/receive` | owner | Goods in |
| `/stock/adjust` | owner | Count correction |
| `/products` | owner | CRUD, prices, fast-mover flag |
| `/more` | both | Draws, today report, backup, users (owner) |
| `/reports/today` | owner (attendant: own shift) | Totals by tender |
| `/reports/deni` | owner | Who owes |
| `/reports/profit` | owner | Estimate only |
| `/settings` | owner | Shop name, MoMo number, PINs |

### Phase 0 — Freeze (planning chat, not builder)

- [x] Vision, domain, approaches written
- [x] Human locks approach A, grocery, English, two devices
- [x] `UI_MAP.md` written
- [x] `SYNC.md` written
- [x] Thin sync is v1 phase 6, not a switch to Approach C

### Phase 1 — Skeleton + money + data layer

**Status: DONE 2026-09-05** (`tsc` clean, 16 tests pass)

**Build**

- Next.js app in this folder
- UGX helpers + tests
- Dexie schema from `DOMAIN.md` entities (`Business` + `Shop` from day one; seed one business + one shop)
- Seed (dev/demo flag): one shop `Demo Duuka`, owner PIN `1234`, shop code `DUKA-DEMO`, 8 grocery products with plausible Kampala retail UGX:

  | Product | Unit | Buy | Sell | Opening qty | Fast mover |
  |---|---|---:|---:|---:|---|
  | Sugar 1kg | kg | 4,200 | 5,000 | 20 | yes |
  | Cooking oil 1L | l | 7,500 | 9,000 | 12 | yes |
  | Bar soap | pc | 2,500 | 3,500 | 24 | yes |
  | Posho 1kg | kg | 2,200 | 2,800 | 30 | yes |
  | Rice 1kg | kg | 4,000 | 5,000 | 15 | yes |
  | Soda 500ml | pc | 1,200 | 1,500 | 24 | yes |
  | Water 500ml | pc | 700 | 1,000 | 24 | yes |
  | Eggs | pc | 500 | 700 | 30 | yes |
- Backup export/import (JSON download / file pick)

**Verify**

- `tsc` clean
- Tests: ugx format; db can insert shop + product
- Export then import restores products

### Phase 2 — PIN, shift, sell cash

**Status: DONE 2026-09-05 after audit patch.** See `PHASE2_AUDIT.md`. `tsc` clean, 28 tests pass.

**Build**

- PIN screen
- Open shift with float
- Sell screen: grid of fast movers, cart, cash tender, change
- Stock decreases on sale
- Today totals

**Verify**

- Tests: cash sale reduces stock; change = tendered − total
- Manual: sell 1 sugar on phone-sized viewport, no network (DevTools offline)

### Phase 3 — MoMo, split pay, deni

**Status: DONE 2026-09-05 after audit patch.** See `PHASE3_AUDIT.md`. `tsc` clean, 35 tests pass.

**Build**

- Tenders: cash, mtn_momo, airtel_money, credit
- Split pay (sum must equal total)
- Customer pick for credit
- Collect deni screen
- Show shop MoMo number at pay time (from settings)

**Verify**

- Tests: credit sale increases balance; collection decreases; split 10k cash + 5k momo on 15k sale
- Cannot complete credit sale without customer

### Phase 4 — Receive, adjust, owner draw, void

**Status: DONE 2026-09-06 after audit patch.** See `PHASE4_AUDIT.md`. `tsc` clean, 43 tests pass.

**Build**

- Receive stock + update last buying price
- Adjust with reason
- Owner draw (cash leaves till)
- Owner void sale (reverse stock + deni)

**Verify**

- Tests: receive +10; void restores; draw reduces expected cash

### Phase 5 — Close the day

**Status: DONE 2026-09-06 after audit patch.** See `PHASE5_AUDIT.md`. `tsc` clean, 49 tests pass.

**Build**

- Expected cash formula from `DOMAIN.md`
- Counted cash input
- Variance display
- Shift close; cannot sell until a shift is open
- Reports: today, deni list, profit estimate, low stock

**Verify**

- Fixture test: float 50,000 + cash sales 80,000 − draw 10,000 → expected 120,000
- Manual close on phone

### Phase 6 — Thin sync (two devices)

See `SYNC.md`. Do not start this phase until 1–5 pass offline.

**Build**

- Prisma schema matching Dexie entities (`shop_id` on all business tables)
- `/api/pair/create` and `/api/pair/join`
- `/api/sync` push/pull + outbox
- Stock qty recomputed from movements (never LWW the number)
- UI: setup create/join, online pill, Sync now, Pair another device
- App still sells if `DATABASE_URL` is missing (cloud pill: `Cloud not configured`)

**Verify**

- Tests listed in `SYNC.md`
- Manual: Device A sells offline → Device B does not see it → A goes online → B pulls → sale appears; stock matches

### Phase 7 — Many shops

Do not start until Phase 6 works.

**Build**

- Owner: `Add shop` (name, optional copy products from existing shop, quantities 0)
- Each shop gets its own `shop_code`
- Pair a till device to that code
- Owner home: today’s sales per shop + grand total; tap to enter a shop
- Attendant: no switcher; wrong-shop token cannot see other shops
- All existing screens stay shop-scoped (`shop_id` already on rows)

**Verify**

- Two browsers: Shop A sells sugar; Shop B stock of sugar unchanged
- Owner laptop shows both shops’ today totals after sync
- Attendant on A cannot open B

**Out:** stock transfer UI, shared warehouse, shared customers

### Phase 8 — Hardening for a real shop

**Build**

- Service worker / install prompt (“Add Duuka to home screen”)
- Warning: clearing site data destroys books
- Large tap targets, outdoor contrast pass
- Empty states
- Attendant vs owner menu hiding
- Seed data removed or behind “demo shop” flag
- `PROGRESS.md` updated

**Verify**

- Lighthouse-ish: works offline after first visit
- 360px layout does not overflow on sell screen
- 7-day field test checklist (below) printed for the human

### Phase 9 — Field test (human + planning chat)

Not code. Sit with one keeper.

- [ ] Day 1: enter real products and prices
- [ ] Days 1–7: all sales through Duuka
- [ ] Every evening: close
- [ ] Note every time they reach for the exercise book — that is a product bug
- [ ] Planning chat updates `DOMAIN.md` from notes
- [ ] Builder patches only those notes

### Later (not v1)

- Tenancy / paid product (Approach C features)
- WhatsApp daily summary (Approach B as a channel)
- Barcode camera
- Bluetooth thermal printer
- Expiry
- Multi-shop
- URA
- MTN Collection API (auto-confirm MoMo)

### Expected-cash formula (implement exactly)

```
expected_cash =
  opening_float
  + sum(cash tenders on completed sales in this shift)
  + sum(cash deni collections in this shift)
  − sum(cash owner draws in this shift)
  − sum(cash expenses in this shift)
  − sum(cash change given)   // only if change is not already netted in tender.amount
```

Pick one convention and test it:

**Convention:** `Tender.amount` is the amount applied to the sale. `amount_tendered` is what the customer handed over. `change = amount_tendered − amount`. Expected cash increases by `amount` for cash tenders, not by `amount_tendered`.

Then change does **not** need to be subtracted again.

---

## Track B — WhatsApp ops (only if locked)

Do not implement unless `DECISIONS.md` says Approach B.

1. Postgres + small Next.js admin (products, customers)
2. WhatsApp Cloud API webhook
3. Interactive list: pick product → qty → tender
4. Ledger same as domain (sales, stock, deni)
5. Commands: `today`, `low stock`, `who owes`, `close`
6. 7pm summary to owner

**Blocker:** Meta business verification. Start that the same day you lock B, before code.

Risk: busy counter. Confirm the target shop is low-volume.

---

## Track C — Multi-tenant SaaS (only if locked)

Do not implement unless `DECISIONS.md` says Approach C.

Still ship a till vertical slice first (sell + stock + close) for **one tenant**, always-online, before tenancy chrome.

Order:

1. One-tenant Next.js + Postgres POS (no Expo yet)
2. Auth (phone + PIN or magic)
3. Then Expo till if the PWA is not enough
4. Then tenant table + onboarding
5. Offline sync last (hard)

If you locked C because you want two devices on day one, you still need a server in phase 1. Accept the longer calendar.

---

## Builder agent start command

1. Read `LOCKED_PLAN.md` then this file
2. Create Next.js app in this directory (keep the existing `.md` files)
3. Execute **Phase 1 only** (one demo shop, but schema has `business_id` + `shop_id`)
4. Stop and report what to tap to verify

Do not generate a marketing landing page. This is a working till, not a startup homepage.
