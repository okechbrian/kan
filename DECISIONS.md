# Decisions

Anything agreed in chat must land here. The builder agent reads this file first after the README.

Status key: `OPEN` | `LOCKED`

---

## Locked

| ID | Decision | Status | Date | Notes |
|---|---|---|---|---|
| D40 | Product re-scoped from Duuka-only till to **Kan** platform; offline till core reused | LOCKED | 2026-11-24 | Supersedes the Duuka-only scope; see `KAN_SCOPE.md` |
| D41 | First market **Uganda**, currency **UGX integer only**; no FX/multi-currency in first release | LOCKED | 2026-11-24 | Inherited money rules remain absolute |
| D42 | First shippable release = **public marketing site + honest dashboard shell** | LOCKED | 2026-11-24 | Commerce engine follows in R2+; no fake data in shell |
| D43 | Banking, crypto and AI are **partner-or-defer, never fake** | LOCKED | 2026-11-24 | No simulated balances, no unguarded AI |
| D44 | Public brand name is **Kan** | LOCKED | 2026-11-24 | Folder name unchanged |
| D45 | No owned domain yet; use Vercel Hobby `*.vercel.app` via `NEXT_PUBLIC_SITE_URL` | LOCKED | 2026-11-24 | Attach real domain later without code changes |
| D46 | Konna is a **structural reference only** — no copied copy, branding, testimonials, numbers or legal text | LOCKED | 2026-11-24 | Feature-state labels: Available now / Coming soon / With partner |
| D47 | `KAN_SCOPE.md` is authoritative for scope; this file is authoritative for decisions | LOCKED | 2026-11-24 | Conflicts in older docs resolved in favour of these two |
| D48 | Pixel-close Konna layout, navigation, and tool-flow parity; zero copied text, images, icons, logos, testimonials, or metrics | LOCKED | 2026-11-25 | Demos labeled `"Demo"` with realistic UGX figures; amends D46 |
| D49 | Provision a new **Neon PostgreSQL** database via Vercel Marketplace (`neon-blue-clock`) for cloud accounts, multi-device sync, and live storefront orders | LOCKED | 2026-11-25 | Switched from Supabase due to active free-project limit; auto-connected to `kan-sme` |
| D50 | Legal entity **Pwata Inc** ("Kan is a product of Pwata Inc"); address Block 5D, Entebbe Kiwafu, Uganda; phone/WhatsApp `0791149592` (`+256 791 149 592`); email `ubombo256@gmail.com`; Konna subscription & hardware prices converted to integer UGX | LOCKED | 2026-11-25 | Rates referenced: `1 USD ≈ 4,240 UGX`, `1 NGN ≈ 3.05 UGX` |
| D51 | Audit remediation of existing code is the current authorized work: security, transactional sync, money/stock, access controls, backup coverage, honest feature states and verification. This supersedes R1-only editing restrictions for these fixes; it does not unlock a new feature release. | LOCKED | 2026-11-26 | User explicitly requested all audit findings fixed. Online ordering remains Coming soon; no fabricated success. Live deployment and two-device field sign-off remain separate verification. |
| D52 | Full Konna tool coverage remains the product target. The 12-tool grocery MVP grouping is an interim readiness assessment only and must not reduce the agreed parity scope. Every reference capability must be mapped to implementation and end-to-end acceptance evidence. | LOCKED | 2026-11-26 | Owner reiterated all Konna tools must be built. Preserve Uganda/UGX/offline rules; banking and crypto require licensed partners, AI a real configured provider; no simulated completion. |
| D0 | Project folder is `Desktop/New folder/SME Management System` | LOCKED | 2026-09-02 | All docs live here |
| D1 | Working product name is **Duuka** | LOCKED | 2026-09-02 | Folder name unchanged |
| D2 | Docs are the source of truth for the builder agent | LOCKED | 2026-09-02 | See WORKING_METHOD.md |
| D3 | v1 currency is UGX stored as integer shillings | LOCKED | 2026-09-02 | |
| D4 | v1 payments: cash, MTN MoMo, Airtel Money, credit (deni) | LOCKED | 2026-09-02 | MoMo is manual confirm |
| D5 | v1 is not URA/EFRIS, not ERP, not a customer shopping app | LOCKED | 2026-09-02 | |
| D10 | **Superseded.** Not pure A, not B, not fat C. See D30 | LOCKED | 2026-09-02 | Historical: first pick was A |
| D11 | First vertical: **grocery duuka** | LOCKED | 2026-09-02 | Seed a fictional Kampala grocery |
| D12 | No real shop yet for 7-day test | LOCKED | 2026-09-02 | Field test waits; build proceeds |
| D13 | UI language v1: **English only** | LOCKED | 2026-09-02 | |
| D14 | Devices: **owner laptop + attendant phone from day one** | LOCKED | 2026-09-02 | See D15 |
| D15 | Two devices via **thin sync**, not a three-app rewrite | LOCKED | 2026-09-02 | Phases 1–5 one device; phase 6 Postgres outbox. Stock qty from movements. See SYNC.md |
| D30 | **Locked product:** offline-first **multi-shop** PWA | LOCKED | 2026-09-02 | A's till + slim C (many shops, one owner) + B as later WhatsApp digest only. Source: RESEARCH.md + LOCKED_PLAN.md |
| D31 | Many shops in v1, after the till works | LOCKED | 2026-09-02 | Phase 7. Device bound to one shop. Owner sees all shops |
| D32 | No inter-shop stock transfers in v1 | LOCKED | 2026-09-02 | Copy catalogue when adding a shop; stock stays independent |
| D33 | Deni / customers are **per shop** in v1 | LOCKED | 2026-09-02 | |
| D34 | EFRIS / URA still out of v1 | LOCKED | 2026-09-02 | Informal dukas will not type sales into a tax pipe |
| D35 | WhatsApp is a **channel**, not the cash register | LOCKED | 2026-09-02 | Phase 10 at earliest |

---

> **Supersession note (2026-11-24):** D5, D10, D30–D35 describe the earlier Duuka-only v1 and are retained for history. D40–D47 now govern the Kan platform. Where an older decision says "no online store / no AI / no billing / no multi-app", D40–D47 override it.

---

## Open — blocking (answer before scaffold)

No product decision blocks the D51 remediation. The original R1 build gate is historical; no new feature release is unlocked by the audit fixes.

Still needed from the owner for final copy (not blocking code): final UGX plan prices, legal entity name, preferred tagline (default "Kan — your shop, in one place.").

Read `LOCKED_PLAN.md` and `RESEARCH.md` before scaffolding.

Postgres keys (D16) are needed for **phase 6**, not phase 1.

---

## Open — not blocking for phase 1

### D16 — Where does Postgres live for sync?

- Supabase (default if we have a project)
- Vercel Postgres
- Local Docker only until field test

**Status:** OPEN — only blocks phase 6.

### D20 — Product public name

Duuka vs something else (Duka Books, Till, etc.)

### D21 — Receipt printer later?

Assume no for v1. On-screen receipt only.

### D22 — Barcode later?

Assume no for v1. Search + fast-mover tiles.

### D23 — Default owner PIN in development

`1234` is fine in dev. Force change before field test.

---

## Log

Add newest entries at the top.

### 2026-11-25 — Konna Parity Plan, Brand Guidelines & Pwata Inc Details Locked (D48–D50)

Owner locked `Kan-Brand-Guidelines.pdf` v1.0 (Navy `#070D35`, Teal `#42DFD1`, Guava `#FF806B`, Soft White `#FAFAFF`, Noto Sans, clean SVG wordmark), Pwata Inc legal/contact details (`ubombo256@gmail.com`, `0791149592`, Block 5D Entebbe Kiwafu), Supabase Postgres for cloud sync (D49), and Konna pricing converted to integer UGX (`KONNA_PARITY_PLAN.md`).

### 2026-11-24 — Product re-scoped to Kan

Owner asked to transform the project into a Konna-style platform. Locked D40–D47: brand Kan; Uganda/UGX only; first release = public site + dashboard shell; banking/crypto/AI partner-or-defer; Konna is a structural reference only; temporary Vercel domain until a real domain exists. Full teardown, 13 workstreams, 12 releases and tool audit written to `KAN_SCOPE.md`. The 49-test offline till is preserved and becomes the core of R3.

### 2026-09-06 — Phase 5 audited and patched

Close UI existed but duplicated the cash formula, filtered by calendar day, hid variance at 0, skipped the rest screen, and tests wrote Dexie by hand. Added `closeShift` / `shiftCashBreakdown`. Fixture 50k+80k−10k=120k passes via `expectedCash`. 49 tests. Phase 6 released.

### 2026-09-06 — Phase 4 audited and patched

Receive/adjust UI existed but was not owner-only; tests were circular. Owner draw and void screen were missing. Added `receiveStock` / `adjustStock` / `recordDraw` / `expectedCash`, multi-line receive, `/more/draw`, `/more/sales` void. 43 tests pass. Phase 5 released.

### 2026-09-05 — Phase 3 audited and patched

Lib was mostly right. Pay UI was not: cash change dead, extra Add tap, no Split tab, wrong confirm labels, credit without customer possible, no customer detail/ledger, collection could go negative. Patched to match UI_MAP. 35 tests pass. Phase 4 released.

### 2026-09-05 — Phase 2 audited and patched

Gaps: owner PIN had empty shop_id (empty sell grid); PIN auto-submit at 4 digits; buying_price_snapshot=0; cart sat on the nav; no today totals; tests did not call till code. Patched. `tsc` clean, 28 tests pass. Phase 3 released.

### 2026-09-05 — Phase 1 signed off

Verified in project dir: `npm run typecheck` (tsc --noEmit) exit 0; `npm run test` 16/16. Home page seeds, lists 8 products, shows `DUKA-DEMO`, mounts BackupButton. Opening stock movements + devices table + fixed `ugx()` present. Phase 2 released.

### 2026-09-02 — Session closed; handoff written

Planning session paused for ISP switch. Wrote `HANDOFF.md` so the next agent starts there. Phase 1 still not signed off. Phase 2 still not released.

### 2026-09-02 — Phase 1 code arrived, not signed off

Builder wrote Next/Dexie/money/seed/backup. Planning review: schema and seed prices are right; home page does not seed; BackupButton unused; no `.gitignore`; npm install blocked by TLS/proxy so tests never ran. See `PHASE1_REVIEW.md`. Do not start Phase 2 until punch list P1 is done and tests are pasted.

### 2026-09-02 — Plan zeroed after Uganda research

Human asked what works in Uganda and required **multiple shops**. Research: offline till is mandatory (power, data, MoMo outages); WhatsApp is the customer OS not the till; every local POS already sells offline + multi-branch; EFRIS scares informal dukas. Locked **D30**: A's counter + slim multi-shop, one PWA. Wrote `RESEARCH.md` and `LOCKED_PLAN.md`.

### 2026-09-02 — Approach locked

Human locked A, grocery, English, no field shop yet, two devices. Planning chat interpreted two-device as thin sync (D15), not Approach C. Wrote `UI_MAP.md` and `SYNC.md`.

### 2026-09-02 — Planning started

Wrote vision, domain, three approaches, working method, implementation draft.
