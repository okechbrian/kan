# Kan — Full Scope

**Status:** ACTIVE — supersedes the Duuka-only scope in `LOCKED_PLAN.md` / `PRODUCT_VISION.md` (see `DECISIONS.md`, D40–D47).
**Date:** 2026-11-24
**Brand:** Kan · **Market:** Uganda · **Currency:** UGX (integer shillings only)
**Reference product studied:** [Konna](https://www.konna.io/) (Nigerian commerce SaaS). Konna is a **reference**, not a source of copy, branding, testimonials, numbers or legal text.

This file is the source of truth for *how big the product is*. `LOCKED_PLAN.md` says *what is locked right now*. `UI_MAP.md` says *which screens exist*. When they disagree, this file wins only for scope, and `DECISIONS.md` wins for decisions.

---

## 1. Product definition

Kan is an Uganda-first, multi-tenant commerce platform for shopkeepers. A merchant runs the counter offline on a phone, keeps stock and credit (deni) correct, and — as the platform grows — opens an online store, takes digital payments, sees analytics, and lets customers discover the shop. It is built on the existing Duuka offline till: that engine is reused, not rewritten.

### Non-negotiables inherited from Duuka (keep forever)

- UGX is an **integer**; never floating point. Display `UGX 50,000`.
- A sale completes **with no network**. A failed fetch must never block charging.
- Attendants use **PIN**, never email. No barcode, printer or GPS may be *required*.
- Negative stock is allowed with a warning; never block a sale because stock is 0.
- Credit requires a customer; cash does not.
- Void is owner-only and reverses stock and deni. No silent deletes.
- Every business row carries `business_id` + `shop_id` from day one.
- Backup export/import is part of v1.
- `.env` is never committed. No `console.log` in production paths.
- No invented testimonials, customer counts, revenue figures or capabilities.

### New locks (this pivot)

- Public name **Kan**. Folder name stays `SME Management System`.
- No owned domain yet: deploy on Vercel Hobby `*.vercel.app` until a domain is bought. All URLs via `NEXT_PUBLIC_SITE_URL`.
- First shippable release = **public marketing site + honest dashboard shell**, not the commerce engine.
- Banking, crypto and AI are **partner-or-defer** — never simulated.
- Multi-currency and EFRIS/URA stay out until explicitly unlocked in writing.

---

## 2. What Konna actually is (teardown)

Konna's public GitHub repo (`konnadex/konna`) contains only an installer README — no source. The following is from the live site and dashboard.

### 2.1 Public surface
Home; Features; Supported Businesses; Pricing; POS Devices; Login/Register (`app.konna.io`); Download (Google Play `com.konna`, App Store `id6761727955`, Windows `.exe` via GitHub releases, v10.0.14); Help; Privacy Policy; Merchant Terms; General Terms; Account Deletion; WhatsApp/social channels; Refer-a-Friend (one month free); newsletter.

### 2.2 Merchant dashboard
Sales overview (revenue / orders / average basket with deltas, last 7 days, all branches), daily sales chart, stock alerts (e.g. "Panadol 500mg — low stock, 4 left"), channels sync status ("Online store, 412 products, Live"), POS cart/charge, Products, Orders, Customers, Reports.

### 2.3 Commerce modules
| Module | Capabilities observed |
|---|---|
| Online Store | Custom shop website/subdomain, no hosting fee, catalog synced with inventory, out-of-stock & expiry suppression, social links, 24/7 storefront, digital receipts, invoices to creditors, notifications (new order, staff login/out, low/expiring stock, least/most purchased, reports) |
| Inventory | Quick add by unit/g/kg/litre/metre, brands, production & expiry dates, real-time cross-device stock, barcode & QR scanning, stock in/out |
| Sales / Orders | Order management, pay-later invoices, customer reviews, checkout by barcode/QR/name, digital + printed receipts, sales team targets & privileges, customer register with automated messages, delivery options/tracking numbers, disputes |
| Payments | Split payment, bank transfer, card (Interswitch / Flutterwave / Paystack / PayU), gift cards, stablecoin crypto with wallet address and blockchain confirmation, cash with FX conversion, fiat + stable |
| Analytics | Product performance hourly→yearly, sales report (charts/quantities/totals/payment methods), expenses chart, profit margin per product |
| Warehouse | Multi-location stock, transfers, location visibility |
| Booking & Service Commerce | Appointments, service schedules, staff, customer experience |
| Staff / Loyalty / Expenses | Roles & permissions, customer profiles/history, loyalty & rewards, expense tracking |
| Supply Chain & Production | Suppliers, production batches, inbound stock |
| Business Banking | Wallet balances, transfers, payouts, settlements |
| Discover Merchants | Public directory of stores, restaurants, pharmacies, salons, spas, laundries; browse and shop directly |
| AI Agent | Natural-language shopping and business questions, sales insights, actions on reports |

### 2.4 Verticals (16)
Pharmaceutical shops, restaurants, superstores, bakeries, fashion shops (tailors/designers/shoemakers/hair/makeup), kiosks, agro-based products, electrical & electronic gadget shops, furniture shops, bars, food shops, groceries, SMEs, spas & salons, factories, laundries. Each implies specialist data (expiry, tables, recipes, measurements, bookings, BOM, order tracking).

### 2.5 Commercial model
Five tiers — Basic / Growth / Scale-Up / Premium / Enterprise — with caps on staff (2→unlimited), branches (1→unlimited), businesses (1→unlimited), SKUs (500→unlimited), CSV bulk upload (Scale-Up+), AI insight (Enterprise only), online-store depth. Billing periods: monthly, quarterly, 6-month, yearly. Trial, cancel-anytime, discount messaging.

### 2.6 Hardware
Smart cash register (15.6" touch, Intel i3, Windows 11 Pro, 8GB/128GB; NGN 386k–440k), thermal receipt printer (NGN 65k), barcode/QR scanner (NGN 33k), cash drawer (NGN 52k). Windows app auto-update; keyboard-wedge scanners.

---

## 3. Gap: Duuka today → Kan target

**Reuse:** Next.js 14 + TS + Tailwind, Dexie/IndexedDB offline ledger, Prisma schema with tenancy keys, integer-money helper, 49 passing tests, PIN/shift/sell/tenders/deni/receive/adjust/draw/void/close/report, Phase-6 sync scaffolding (`sync-core.ts`, `/api/pair`, `/api/sync`, outbox).

**Net new:** public marketing site, dashboard shell, real auth & RBAC, subscriptions/quotas, notifications, catalogue depth (barcode/expiry/batches/brands), warehouses & transfers, purchasing/suppliers, payment gateways, online storefront + cart/checkout, marketplace + merchant directory, CRM/loyalty/reviews, bookings, charts, AI agent, native/desktop clients, hardware integrations, legal/support/ops.

**Repository baseline above is historical. Current state:** versioned Next.js/Prisma/Dexie app with public pages, local dashboard tools, auth routes and sync. D51 audit remediation is active; original release-completion claims are withdrawn. Online ordering remains Coming soon.

---

## 4. Scope by workstream

### WS-0 — Governance & re-lock
New vision/plan/docs; amend `DECISIONS.md` (D40–D47); `git init` + push; CI; env config.

### WS-1 — SaaS platform foundation
Tenant/business/branch model, owner/staff auth, RBAC & permission matrix, onboarding wizard, subscription plans with quotas, trials, invoices, dunning, refer-a-friend, tenant-scoped REST API, background jobs, object storage, notification service (email/SMS/WhatsApp/push), audit log, system admin.

### WS-2 — Catalogue & inventory
Products with units, brands, images, variants, barcode/QR, production & expiry dates, batches, suppliers, reorder levels, tax flags, warehouses, inter-shop transfers, stock counts, adjustments, valuation, low-stock & expiry alerts, CSV/Excel bulk import.

### WS-3 — Purchasing & supply chain
Purchase orders, goods received, supplier ledger/payables, returns to supplier, recipes/BOM, batch traceability, inbound workflow.

### WS-4 — POS & sales (extend existing)
Cart, split tenders, discounts/promotions, price override with permission, returns/refunds, gift cards, receipt designer (logo/notes/customer), print + share, keyboard-wedge barcode and camera QR, multi-device offline outbox hardening.

### WS-5 — Payments (orchestration)
Adapter boundary: cash, MTN/Airtel MoMo (manual confirm first, collection API later), bank transfer, cards via licensed gateways available in Uganda, gift cards, crypto via processor only, split payments, FX display where legal. Webhook verification, idempotency, reconciliation, settlements, refunds/disputes. Never store card data.

### WS-6 — Online store & channels
Tenant storefront (subdomain, later custom domain), storefront builder, live catalogue sync + out-of-stock/expiry suppression, cart/checkout, order status and delivery tracking, digital invoices, reviews, shareable social storefront, marketplace connector (channel sync + unified order inbox), public "Discover Merchants" directory with search by category/location.

### WS-7 — Customers, CRM & loyalty
Phone-first customer register, segments, deni ledger, automated messages, loyalty points/rewards, campaigns, review moderation.

### WS-8 — Bookings & service commerce
Service catalogue, staff schedules, appointments, deposits, calendar, reminders (prerequisite for salon, laundry, factory service).

### WS-9 — Analytics & AI
Dashboards (sales, orders, basket, product performance, expenses, profit margin, stock), scheduled reports/exports, alerts. AI agent: natural-language tenant-data queries and insights; strict tenant isolation, prompt-injection defences, token/cost caps, "never state" guardrails, human confirmation for money actions. **Not before R10.**

### WS-10 — Vertical packs
Wave 1: groceries, kiosks, food shops, bars, SMEs.
Wave 2: pharmacy, bakeries, restaurants, spas/salons, laundries.
Wave 3: superstores, fashion, agro, electrical, furniture, factories.

### WS-11 — Clients & hardware
Web dashboard + PWA; Android and iOS (Expo or Flutter); Windows desktop wrapper with auto-update; offline sync; barcode scanner; ESC/POS thermal printing; cash drawer; device pairing. App-store accounts, screenshots, privacy labels, signing certificate.

### WS-12 — Trust, legal & operations
Tenant isolation/RLS, rate limiting, secrets, backups/DR, monitoring/logging, CI/CD with render + E2E gates, security review, privacy/terms/merchant terms/account deletion, help centre/FAQ, data export/deletion, localisation (English first, Luganda later).

### WS-13 — Business banking & crypto (partner-only, blocked)
Wallet balances, transfers, payouts, settlements, KYC/AML. Requires a licensed partner/white-label provider. Crypto requires a processor; Kan never holds keys. No fake balances under any circumstance.

---

## 5. Feature-state vocabulary (use everywhere)

| State | Meaning |
|---|---|
| `Available now` | Built and verified. Safe to sell today. |
| `Coming soon` | On the roadmap, not built. No fake data behind it. |
| `With partner` | Needs a licensed/regulatory partner. Cannot be promised on a date. |

Marketing and dashboard copy must use these states. Empty panels say what to do ("No sales yet — open the till to begin"), never invented numbers.

---

## 6. Release roadmap

| Release | Contents | Exit criterion |
|---|---|---|
| **R0** | Re-lock docs, git repo, brand | Builder docs match the target; repo pushed |
| **R1** | Public site + honest dashboard shell, CI, Vercel temp domain | All public routes 200 anonymously; 0px overflow at 360/375/412; no fabricated data; gates green |
| **R2** | Tenancy, auth, RBAC, onboarding, subscriptions, notifications, audit | Second tenant isolated; quotas enforced |
| **R3** | Catalogue, inventory, port 49 till tests, barcode, receipts | Offline sale works; multi-branch stock correct |
| **R4** | Payments: cash, MoMo, bank/card adapters, split, reconciliation | Tenders sum to total; idempotent webhooks; no card data stored |
| **R5** | Online store, storefront, checkout, delivery, reviews, invoices | A real buyer can order from a shared link |
| **R6** | Social store, marketplace connector, Discover Merchants | One product edit reflects on all channels |
| **R7** | Analytics, scheduled reports, alerts | Figures match a known ledger fixture |
| **R8** | Android/iOS/Windows, hardware integrations | Offline sale on device, then sync |
| **R9** | Vertical waves 1–3 | Each pack has a testable workflow |
| **R10** | Guardrailed AI; banking/crypto via partner only | Tenant isolation proven; no regulatory exposure |
| **R11** | Support, DR, security review, app-store release | Live, monitored, backed up |

---

## 7. Tool & asset audit (verified 2026-11-24)

**Present:** Node v22.13.1 · npm 10.9.2 · git 2.54 · Python 3.13.13 · Docker · JDK 26 · adb (Android SDK) · Vercel CLI · EAS CLI · Supabase CLI · Flutter · GitHub CLI (authenticated) · existing Next.js/Prisma/Dexie/Vitest codebase.

**Needed, in blocking order:**

| Need | Blocks | Notes |
|---|---|---|
| `git init` + remote | R0 | folder is unversioned |
| Tagline + logo/colours | R1 | choose "Kan — your shop, in one place." unless replaced |
| Vercel slug + Protection off | R1 | `kan`, `kan-sme`, `kan-uganda` candidates |
| Indicative UGX plan prices | R1 | mark as indicative until approved |
| Legal entity name | R1 | placeholder must be explicit, not invented |
| Supabase project + keys | R2 | new project; do not reuse Ba Lubaale |
| SMTP credentials | R2 | receipts, invoices, alerts, auth |
| Payment merchant accounts | R4 | Uganda-available gateways; MoMo collection |
| Domain + DNS | R5 | custom domains for storefronts |
| Google Play / Apple Developer accounts | R8 | $25 one-time / $99 per year |
| Windows code-signing cert | R8 | installer + auto-update |
| Test hardware (scanner, printer, drawer) | R8 | sign-off, not development |
| LLM API key | R10 | guardrails first |
| Licensed banking/crypto partner | R10 | hard external dependency |

**Environment traps:** forced proxy breaks raw Postgres TCP and some npm TLS (use HTTPS/MCP paths); GitHub Actions billing was previously blocked — recheck; never commit `.env`; keep this folder isolated from other repos' concurrent agents.

---

## 8. Risks

1. **Scope vs calendar** — Konna is a mature product. R1 exists to make a real public presence before the engine is finished; it must not pretend the engine exists.
2. **Regulated modules** — banking, crypto, card acquiring. Partner-or-defer is the only safe path.
3. **Brand collision** — no obvious "Kan POS Uganda" hit in search, but a trademark/handle check is still advised before printing assets.
4. **Tenant isolation** — the single most dangerous bug class once R2 lands. RLS + tests before any real merchant data.
5. **Offline correctness** — inherited from Duuka; do not regress it while adding cloud features.

---

## 9. Decisions (see `DECISIONS.md` for the authoritative log)

- Rewrite the locked product as Kan; reuse the Duuka till core — **locked 2026-11-24**.
- Uganda / UGX only for first release — **locked 2026-11-24**.
- First release = public site + dashboard shell — **locked 2026-11-24**.
- Banking, crypto, AI = partner or defer, never fake — **locked 2026-11-24**.
- Brand **Kan**; no domain yet; Vercel free-tier temporary URL — **locked 2026-11-24**.
