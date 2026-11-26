# Kan × Konna Parity Master Plan (Uganda)

## 6. Step 01 provisional capability and gap register — 2026-11-26

Status: **accepted documented baseline under D54; reference verification incomplete**. K01–K56 below identify delivery groups, mapped one-to-one to D53 steps 01–56. They are not 56 individual tools. Compound rows must be expanded before their individual builds; the owner accepted this baseline without a full reference walkthrough. No definitive fully functional tool count is established yet; local till evidence in HANDOFF is bounded and does not establish complete platform parity.

Source key (all public checks dated 2026-11-26):

- I: [inventory](https://www.konna.io/manage-inventory), public claims checked; units/brands, dates, scanning and cross-device stock.
- S: [sales](https://www.konna.io/manage-sales), public claims checked; pay-later, invoices, staff, customers, delivery and feedback.
- O: [online shop](https://www.konna.io/onlineshop), public claims checked; shop identity, catalogue, notices and receipts.
- P: [payments](https://www.konna.io/payment), public claims checked; split, transfers, cards, gift cards, stablecoin and currency conversion.
- H: saved teardown in KAN_SCOPE sections 2–4 and this document sections 3–4; **not independently reverified this session**.
- K: Kan's own safety/operational scope in KAN_SCOPE, DOMAIN and SYNC; not asserted to be a Konna feature.

Public marketing is advertised scope, not proof of runtime behavior. Authenticated onboarding at `https://app.konna.io/auth/business/create` was inspected on 2026-11-26: searchable category selection, image upload, business name, multiple phone numbers, and at least one branch; branch form has name/address/country/state/city. The category selector contained 30 entries, exceeding the 16 public-facing groups. Map these before specialist builds; 30 categories do not establish 30 distinct workflows. General Goods was selected and forms inspected, but no business was submitted. Browser URL-policy enforcement then stopped control. Dashboard and tutorial walkthroughs remain unverified.

Legend: **partial** means code/helpers or a bounded local workflow exist; **unverified** means acceptance evidence is missing; **blocked** means an external dependency prevents completion. Paths below are relative to repository root. Each fixture also requires tenant and role denial tests, integer UGX, retry safety and appropriate offline behavior. Only explicitly recorded bounded deployment evidence counts; no field sign-off is implied.

| ID / step | Capability / source | Current code and state | Remaining gap / dependency | Required acceptance fixture |
|---|---|---|---|---|
| K01 / 01 | Reference inventory / H,K | This register; partial | Authenticated access, tutorials, atomic IDs and decisions | Every observed feature has evidence and a mapped step |
| K02 / 02 | Deployment baseline / K | Verified production baseline fe0a561; see HANDOFF | Git connection repaired; rollback documented, drill deferred to K55 | READY production SHA, CI and safe health/access checks; rollback target recorded |
| K03 / 03 | Owner onboarding / H | Atomic signup, resume and cloud workspace; verified deployed at 672ab2c | K03.01 credentials/first branch; .02 atomic creation; .03 retry/resume; .04 workspace; .05 isolation/session. See HANDOFF and successful CI 45831098728 | Neon rollback/concurrency/isolation tests and real 360/1440px onboarding passed; till pairing remains K05 |
| K04 / 04 | Recovery email / H | Resend/private queue, atomic token use and recovery UI implemented; local/Neon checks pass | D55: real key, verified EMAIL_FROM and controlled inbox still missing; live delivery blocked | K04.01–04 implemented; K04.05 requires actual Resend acceptance/inbox receipt. No completion claim until delivery verified |
| K05 / 05 | Branch/till pairing / K | `src/lib/server-sync.ts`; partial | Cloud-to-local identity walkthrough | Pair cloud branch without creating disconnected books |
| K06 / 06 | Staff permissions / S,H | `src/lib/platform/access.ts`, `src/lib/pin.ts`; partial | Lifecycle and complete server permission matrix | Disabled attendant cannot act; PIN needs no email |
| K07 / 07 | Multi-branch owner view / H | `src/components/dashboard/LiveDashboardPanel.tsx`; partial | Authoritative cloud totals and switching | Branch A/B totals stay isolated; till binding fixed |
| K08 / 08 | Multi-device offline sync / I,K | `src/lib/sync.ts`, `src/lib/server-sync.ts`; partial | Physical devices | Offline concurrent sales/replay converge exactly once |
| K09 / 09 | Backup and field recovery / K | `src/lib/backup.ts`; partial | Fresh-device drill and seven shop days | Restore, re-pair and reconcile stock/deni/cash |
| K10 / 10 | Catalogue / I,H | `src/lib/commerce/catalogue.ts`, ProductsPanel; partial | Units, brands, variants, images and scan UI completion | Create/edit/archive all required product forms |
| K11 / 11 | Bulk and branch import / H | BulkCsvPanel, BranchCopyPanel; partial | Excel, duplicates, quota and stock-opening semantics | Bad rows rejected; copied products have zero stock |
| K12 / 12 | Batches and expiry / I,H | `src/lib/commerce/inventory.ts`; partial | Batch allocation integrated with sale ledger | Receive/sell/void updates correct batch quantities |
| K13 / 13 | Warehouse balances / H | WarehousePanel; partial | Location ledger and valuation | Location balances sum to shop stock |
| K14 / 14 | Transfers / H | `src/lib/commerce/inventory.ts`; partial | Dispatch/receipt/cancel stock postings | Retry transfer without duplicating either movement |
| K15 / 15 | Supplier ledger / H | PurchasesPanel; partial | Atomic payable ledger and payment history | Purchase less payment equals supplier balance |
| K16 / 16 | Purchasing and receipt / H | PurchasesPanel; partial | Current record creation does not receive stock | Receive/return posts stock, costs and payable atomically |
| K17 / 17 | Pricing controls / H | `src/lib/sale.ts`; partial | Documented promotions and permissioned overrides | Discount totals equal tender sum; denied override fails |
| K18 / 18 | Held orders/invoices / S,H | ReservedOrdersPanel; partial | Defined reservations and invoice-to-payment workflow | Hold/resume/cancel cannot create a premature sale |
| K19 / 19 | Returns/refunds / H,K | `src/lib/sale.ts`; partial | Partial linked returns and provider refunds | Refund twice cannot reverse more than sold |
| K20 / 20 | Receipts and invoices / S,O | `src/lib/commerce/receipt.ts`; partial | Configurable delivery and customer receipt proof | Branding/notes persist; print/share without required printer |
| K21 / 21 | MTN then Airtel collections / K | `src/lib/payments/adapters.ts`; partial, manual only | Merchant accounts and real callback integration | Valid callback settles once; mismatched amount rejected |
| K22 / 22 | Bank/card gateways / P | `src/lib/payments/adapters.ts`; blocked | Agreed Uganda-supported providers, one per substep | Real provider payment roundtrip; no card storage |
| K23 / 23 | Reconciliation/disputes / P,S,H | `src/lib/payments/reconcile.ts`; partial | Settlement, refund and dispute lifecycle | Provider fixture balances sales and payouts |
| K24 / 24 | Gift cards / P | Payment method declaration; blocked | Issuer/provider and liability rules undecided | Concurrent redemption cannot overspend balance |
| K25 / 25 | Public catalogue / O | `src/lib/store/catalogue.ts`, StorePanel; partial | Owner preview is not anonymous storefront | Fresh buyer sees published stock and expiry rules |
| K26 / 26 | Checkout/order inbox / O,H | `src/lib/store/orders.ts`; blocked | Live order API intentionally returns 503 | Server-priced persisted order reaches merchant inbox |
| K27 / 27 | Delivery lifecycle / S,H | Store order helpers; partial | Reservation, dispatch, tracking and cancellation | Delivery/cancel reconcile stock and payment |
| K28 / 28 | Store customization / O | StorePanel; partial | Persisted public branding/domain workflow | Published edits visible from another device |
| K29 / 29 | Reviews / S | Store helpers; unverified | Verified purchase linkage and moderation | Buyer review is scoped; unrelated order denied |
| K30 / 30 | Social selling / O,H | `src/lib/channels/social.ts`; partial | Working buyer links and real channel orders | Shared product resolves and order attribution persists |
| K31 / 31 | Marketplace connectors / H | `src/lib/channels/marketplace.ts`; partial | Agreed connector credentials and actual sync | Edit/order/retry roundtrip without duplicates |
| K32 / 32 | Merchant discovery / H | `src/lib/channels/directory.ts`; partial | Real cross-device published directory | Category/town search returns authorized public shops |
| K33 / 33 | CRM/history/privacy / S,H | CustomersPanel, `src/lib/till.ts`; partial | Unified counter/store/service history and rights | Known customer balance and histories agree |
| K34 / 34 | Loyalty/campaigns / H | `src/lib/verticals/workflows.ts`; partial | Earn/redeem/reverse and consented real delivery | Refund reverses earned points; opt-out prevents send |
| K35 / 35 | Targets/activity / S,H | StaffPanel; partial | Real targets and all activity attribution | Owner sees source-linked activity; attendant denied |
| K36 / 36 | Booking availability / H | BookingsPanel; partial | Cross-device schedules/conflict prevention | Two clients cannot reserve same exclusive slot |
| K37 / 37 | Booking payments/reminders / H | BookingsPanel; partial | Deposit field is not a settled payment | Deposit/refund/completion and reminder reconcile |
| K38 / 38 | Recipes/BOM / H | `src/lib/verticals/wave2.ts`; partial | Versioned persisted recipes, units and costing | Known recipe cost and shortage fixture agree |
| K39 / 39 | Production ledger / H | ProductionPanel; partial | Log does not consume inputs/receive output | One run posts inputs, outputs and waste exactly once |
| K40 / 40 | Sixteen vertical packs / H | `src/lib/verticals/`; partial | One specialist end-to-end workflow per pack | Separate fixture for each named pack below |
| K41 / 41 | Twelve reports / H | `src/lib/analytics/suite.ts`; partial | Complete source-specific queries/filters/export | Each report reconciles known ledgers, dates and branch |
| K42 / 42 | Live dashboard / H | LiveDashboardPanel; partial | Real cross-device KPI deltas/channels | Dashboard equals accepted report fixtures |
| K43 / 43 | Seven notification types / O | NotificationsPanel, analytics alerts; partial | Real event delivery, preferences and retries | Each named event below deduplicates on replay |
| K44 / 44 | Scheduled reports / H | Analytics helpers; unverified | Scheduler, delivery provider and Uganda day bounds | Schedule delivers correct tenant report; failure retries |
| K45 / 45 | Subscription lifecycle / H | `src/lib/platform/plans.ts`, pricing, BillingPanel; partial | Real provider, trial/renewal/dunning/cancel/referrals | Quotas enforced server-side; renewal replay bills once |
| K46 / 46 | PWA install/update / H,K | `public/`; partial | Device install, migration and recovery proof | Offline restart/update preserves books and outbox |
| K47 / 47 | Android / H | Packaging scope only; unverified | Signed client, device and store account | Install, sell offline, sync and upgrade |
| K48 / 48 | iOS / H | Packaging scope only; unverified | Signing, Apple account and device | Install, sell offline, sync and upgrade |
| K49 / 49 | Windows / H | Packaging scope only; unverified | Installer, signing and updater | Install and upgrade preserve books |
| K50 / 50 | Optional hardware / H | `src/lib/hardware/`; partial | Actual scanner/printer/drawer/register tests | Each device works; sale works without any of them |
| K51 / 51 | Real AI assistant / H | `src/lib/ai/guard.ts`; blocked | Provider, grounded tenant queries and action authorization | Isolation/injection/cost tests and real grounded response |
| K52 / 52 | Banking / H | `src/lib/banking/partners.ts`; blocked | Licensed partner, KYC and settlement contracts | Actual partner balances/transfers reconcile |
| K53 / 53 | Processor crypto / P | Partner feature flags; blocked | Processor/regulatory decisions; no custody | Confirmed processor receipt settles once in allowed model |
| K54 / 54 | Site/support/data rights / H,K | Public pages, `src/lib/platform/leads.ts`; partial | Fulfilled requests, legal ownership and truthful availability | Contact/export/deletion handled through completion |
| K55 / 55 | Launch operations / K | CI, backup and audit tests; partial | Production monitoring, DR and rollback drills | Restore and alert drill pass without exposing secrets |
| K56 / 56 | Full acceptance / K | No final sign-off; unverified | All atomic IDs accepted; external blocks resolved | Owner walkthrough and field sign-off; zero silent deferrals |

Panel filenames without a directory refer to `src/components/dashboard/`. Code existence is not acceptance evidence. In particular, manual MoMo recording is not an API collection; helper tests are not provider or cross-device walkthroughs.

### Required serial expansion before inventory sign-off

- K40.01–16: groceries, kiosks, food shops, bars, SMEs, pharmacy, bakeries, restaurants, spas/salons, laundries, superstores, fashion, agro, electrical/electronics, furniture, factories. Specialist behavior must come from approved domain rules; a profile card is insufficient.
- K41.01–12: sales, transactions, customers, expenses, inventory, purchases, refunds, staff, warehouse, restock, transfers, statement.
- K43.01–07: new order, staff login/logout, stock exhausted, least purchased, report, near expiry, most purchased.
- K50.01–04: scanner, printer, cash drawer, register. K21: MTN then Airtel separately. K22/K30/K31: name and approve each provider/channel before its individual build.
- All other compound rows still require atomic capability IDs, individual source evidence, dependencies and fixtures. This register deliberately does not invent a final feature total from delivery-step counts.

### Unresolved scope discrepancies — no implicit unlock

Konna advertises currency conversion (P), while Kan locks integer UGX and excludes multi-currency. Retain this as an explicit parity discrepancy pending owner decision; no FX implementation is authorized. Gift-card liability/issuer and exact Uganda gateway/channel coverage also require explicit product/provider decisions. Banking and crypto remain required partner-blocked scope; exclusion of custody is preserved. No new evidence here establishes payroll or EFRIS as a Konna tool; existing Kan exclusions remain intact. A Uganda adaptation cannot silently claim identical provider coverage.

### Deferred reference work under D54

Restore browser access and inspect an authorized Konna session plus tutorials. Record exact paths and observed actions, expand the grouped register, then resolve the outstanding scope decisions. D54 explicitly permits Step 02 to proceed using this baseline. Full Konna study is not complete; deferred evidence must be resolved before final parity sign-off.

**Active execution rule (D54, 2026-11-26):** Follow the sequential plan in `IMPLEMENTATION_PLAN.md`. Step 01 is an accepted documented baseline; authenticated reference details remain deferred and unverified. Step 03 is verified deployed. Step 04 account recovery is active with Resend; live delivery requires configured credentials, a verified sender and a controlled inbox. Step 05 is not started. Full Konna parity, one step at a time, and all Uganda/offline safeguards remain required.
**D52 reaffirmation (2026-11-26):** Full tool parity is the product target. The smaller grocery MVP is only an interim milestone. Prior phase-complete claims are withdrawn; screens, schemas and helpers require end-to-end acceptance evidence. Current public-site recheck confirms online store/catalogue sync, payment channels, inventory and specialist business capabilities remain relevant. The authenticated dashboard has not been exhaustively re-walked in this session.

**Date:** 2026-11-25  
**Product:** **Kan** — a product of **Pwata Inc**  
**Repository:** `https://github.com/okechbrian/kan`  
**Live Deployment:** `https://kan-sme.vercel.app`  
**Historical reference claim (not fresh verification):** `konna.io` (14 public pages), `app.konna.io` (45+ app routes), Konna public tutorials, and `Kan-Brand-Guidelines.pdf` (v1.0). The current verification boundary is recorded in section 6.

---

## 1. Locked Identity, Legal & Contact Details (D48–D50)

| Item | Locked Value |
|---|---|
| **Product & Legal Entity** | **Kan** — a product of **Pwata Inc** |
| **Office Address** | Block 5D, Entebbe Kiwafu, Uganda |
| **Phone & WhatsApp** | `0791149592` (`+256 791 149 592`) |
| **Support Email** | `ubombo256@gmail.com` |
| **Tagline** | *"Your shop, in one place."* |
| **Brand Palette** | Midnight Navy `#070D35` · Cyan Teal `#42DFD1` · Guava `#FF806B` · Soft White `#FAFAFF` |
| **Contrast Rules** | Soft white on navy (`18.1:1`), navy on teal (`11.4:1`, primary CTA on dark), navy on guava (`7.6:1`, sparing highlights). Primary CTA on light surfaces = **navy button with soft-white text**. |
| **Typography** | **Noto Sans** (`next/font`): Bold `700` headlines/buttons, Regular `400` body (line-height ≥ 1.4), `tabular-nums` for all UGX amounts. Scale: `32px / 22px / 16px / 14px`. |
| **Logo Assets** | Rebuilt as clean SVGs in 3 variants: **Primary** (teal `K` + guava endcap + white `an` on navy), **One-colour** (navy on light), **Black** (thermal receipts). Min width `80px` screen / `24mm` print; clear space = `K` stem width. |
| **D48 — Parity Rule** | Pixel-close layout, section order, navigation, and tool flows to Konna; **zero copied text, images, icons, logos, testimonials, or metrics**. Demos are explicitly labeled `"Demo"` with realistic UGX figures. |
| **D49 — Cloud DB** | New **Supabase PostgreSQL** project connected in Phase 3; tenant isolation enforced. |
| **D50 — Uganda Scope** | Integer UGX only, MTN MoMo & Airtel Money, `+256` phone inputs, Uganda Data Protection & Privacy Act 2019 legal copy; crypto/banking remain `With partner` until licensed. |

---

## 2. Pricing — Konna Converted to Integer UGX

Exchange rates referenced on 2026-11-25: **1 USD ≈ 4,240 UGX** · **1 NGN ≈ 3.05 UGX** (rounded to the nearest UGX 1,000 for clean merchant pricing; all stored amounts are integer shillings).

### 2.1 Subscription Plans (5 Tiers × 4 Billing Cycles)

| Plan | Konna (USD/mo) | Kan Monthly | Kan Quarterly (3 mo) | Kan 6-Month (5% off) | Kan Yearly (2 mo free) | Limits & Features |
|---|---:|---:|---:|---:|---:|---|
| **Basic** | $4 | **UGX 17,000** | UGX 51,000 | UGX 97,000 | UGX 170,000 | 2 staff · 1 business · 1 branch · 500 SKUs · Basic online store · No bulk upload · Analytics only |
| **Growth** | $7 | **UGX 30,000** | UGX 90,000 | UGX 171,000 | UGX 300,000 | 3 staff · 1 business · 2 branches · 1,000 SKUs · Customisable online store · No bulk upload |
| **Scale-Up** *(Popular)* | $9 | **UGX 38,000** | UGX 114,000 | UGX 217,000 | UGX 380,000 | 5 staff · 1 business · 5 branches · 2,000 SKUs · Bulk CSV/Excel & branch import · Warehouse/transfers · Customisable online store |
| **Premium** | $15 | **UGX 64,000** | UGX 192,000 | UGX 365,000 | UGX 640,000 | 20 staff (RBAC) · 3 businesses · 8 branches · 6,000 SKUs · Bulk upload & branch import · Full e-commerce |
| **Enterprise** | $35 | **UGX 148,000** | UGX 444,000 | UGX 844,000 | UGX 1,480,000 | Unlimited staff, businesses, branches, SKUs & uploads · Smart AI Assistant · Custom e-commerce |

### 2.2 POS Hardware Devices (Konna NGN → UGX)

| Device | Konna (NGN) | Kan (UGX) | Key Specs |
|---|---:|---:|---|
| **Smart Cash Register (Single Screen)** | NGN 386,000 | **UGX 1,177,000** | 15.6" HD touch, Intel i3, Windows 11 Pro, 8GB RAM / 128GB SSD, WiFi/BT/LAN/6×USB |
| **Smart Cash Register (Dual Screen)** | NGN 440,000 | **UGX 1,342,000** | Dual touch display (15.6" + 11.6" / 15.6"), same core specs |
| **80mm Thermal Receipt Printer** | NGN 65,000 | **UGX 198,000** | Direct thermal (no ink), 200mm/s, 203 DPI, auto-cutter, USB + LAN + Bluetooth |
| **Barcode & QR Code Scanner** | NGN 33,000 | **UGX 101,000** | 1D/2D & QR, 0.5s scan, USB HID / keyboard-wedge, 1.5m drop rating |
| **POS Cash Drawer** | NGN 52,000 | **UGX 159,000** | 4 bill + 5 coin compartments, steel body, 3-position key lock, RJ11/RJ12/USB |

---

## 3. Public Website Blueprint (14 Pages — Konna Parity)

**Shared Header:** Kan SVG wordmark · 2 mega-dropdowns (**Features** & **Supported Businesses** — all 16 verticals) · Pricing · POS Devices · Login (`/app/sign-in`) · Register (`/app/signup`) · Open Till (`/pos`) · Download (`/download`).  
**Shared Bottom Funnel:** *"Manage your shop online or offline"* CTA → **Subscription Plans** (Monthly / Quarterly / 6-Month / Yearly toggle in UGX) → *"Built for Kampala & Entebbe shopkeepers"* (no fabricated testimonials or customer counts) → **6 FAQs** accordion → **Refer a Friend** (1 month free) → **Newsletter** subscribe form → **4-column Footer** (Pwata Inc · Block 5D, Entebbe Kiwafu · `ubombo256@gmail.com` · `+256 791 149 592`).

| Kan Route | Mirrors Konna | Scope |
|---|---|---|
| `/` | `/` | Hero with interactive **Demo** dashboard preview (UGX revenue, orders, avg basket, 7-day chart, stock alerts, channel sync, quick POS) · Scrolling module strip · 6 core modules · *"Sell. Operate. Accelerate."* (AI / Banking / Supply Chain) · Hardware showcase · *"One Business. One View."* 6-card grid · Discover Merchants CTA · Shared bottom funnel |
| `/manage-sales` | `/manage-sales` | Pay-later / deni & invoices, customer reviews, barcode/QR/name checkout, sales team targets, customer register, delivery tracking |
| `/manage-inventory` | `/manage-inventory` | Quick add by unit/g/kg/L/m, brands, production & expiry dates, real-time cross-device sync, barcode/QR |
| `/payment` | `/payment` | Split payments, cash, MTN MoMo & Airtel Money, bank transfer, card gateways (`Coming soon` / `With partner`) |
| `/onlineshop` | `/onlineshop` | Free custom shop link, live inventory sync, automatic out-of-stock & expiry hiding, social links, 7 notification types, digital & printed receipts + creditor invoices |
| `/business-analytics` | `/business-analytics` | Product performance (hourly→yearly), sales report by tender, expenses chart, profit margin per product |
| `/supported` | `/supported` | All 16 business vertical cards, each with **Create Shop** pre-selecting that vertical |
| `/pricing` | `/pricing` | 5 tiers × 7 feature limits + Monthly/Quarterly/6-Month/Yearly toggle in UGX |
| `/devices` | `/devices` | 4 hardware cards with full specs, UGX prices, and WhatsApp/form order inquiry to `0791149592` |
| `/discover` | Discover Merchants | Public directory of Kan shops searchable by category & Ugandan town, linking to `/shop/[slug]` |
| `/download` | Download | PWA install guide + Android / iOS / Windows roadmap status |
| `/help` | `/help` | Working Contact Us form (`+256` phone), direct email (`ubombo256@gmail.com`), WhatsApp (`0791149592`), social links |
| `/privacy-policy`, `/terms`, `/general-terms` | Legal | Original Uganda legal documents for **Pwata Inc** (Data Protection and Privacy Act 2019) |
| `/account-deletion` | `/account-deletion` | Working deletion request form + 90-day closure / 7-year transaction retention notice |

---

## 4. Web App & Tools Blueprint (`/app/*` + Offline `/pos` Till)

Kan preserves its **offline-first phone till** (`/pos`, `/pin`, `/sell`, `/stock`, `/customers`, `/shift/*`, `/more/*`), while `/app/*` mirrors Konna's full merchant dashboard:

| Module | Target Routes | Capabilities |
|---|---|---|
| **Auth & Workspace** | `/app/sign-in`, `/app/signup`, `/app/forgot-password`, `/app/reset-password`, `/app/business/create`, `/app/business/branch` | Email/password + phone auth, password reset, create business, branch switcher, till device pairing |
| **Dashboard Home** | `/app/dashboard` | Live KPIs (Revenue, Orders, Avg Basket with deltas), 7-day sales bar chart, low-stock & expiry alerts, channel sync status, quick-sell launcher |
| **Stock & Products** | `/app/products`, `/app/products/add`, `/app/products/bulk-csv`, `/app/products/copy-branch`, `/app/products/publish-online`, `/app/products/[id]` | Single add (unit, brand, barcode, buy/sell UGX, reorder level, batch/expiry), **CSV/Excel bulk upload**, **copy from another branch**, **publish/unpublish to online store** |
| **Transactions & Refunds** | `/app/transactions/store`, `/app/transactions/online`, `/app/transactions/service`, `/app/transactions/[id]`, `/app/transactions/[id]/refund` | Separate counter, online, and service views; receipt preview/print/share; **owner-only refund/void** reversing stock & deni |
| **Reserved Orders** | `/app/reserved-orders`, `/app/reserved-orders/[id]` | Held / pay-later orders & creditor invoices tied to customer deni balances |
| **Customers & Loyalty** | `/app/customers`, `/app/customers/[id]` | Phone-first customer register, deni ledger + collection, purchase & booking history, loyalty points |
| **Staff & Activity** | `/app/staff`, `/app/staff/[id]` | Role-based accounts (Owner, Manager, Attendant PIN), targets, per-staff orders/bookings/production history & audit trail |
| **Expenses** | `/app/expenses` | Daily expense logging (rent, transport, utilities, fuel, restocking) feeding net profit & cash close |
| **Purchases & Suppliers** | `/app/purchases`, `/app/purchases/add`, `/app/purchases/[id]` | Supplier register, purchase orders, goods received into stock/batches, supplier payables |
| **Warehouse** | `/app/warehouse` | Multi-location stock visibility, inter-branch/warehouse transfers, restock queue |
| **Analytics (12 Reports)** | `/app/analytics` + sub-views: Sales, Transactions, Customers, Expenses, Inventory, Purchases, Refunds, Staff, Warehouse, Restock, Transfers, Statement | Real integer-UGX aggregations from live DB (with local Dexie fallback), date filters, CSV/print export |
| **Online Store & Channels** | `/app/store`, `/app/channels`, `/shop/[slug]` | Storefront settings, live order inbox, WhatsApp/social share links, Discover listing toggle |
| **Bookings & Production** | `/app/bookings`, `/app/production` | Service calendar & staff schedules (salons/spas/laundries); recipes/BOM & production batches (bakeries/factories) |
| **Notifications & Billing** | `/app/notifications`, `/app/billing`, `/app/upgrade`, `/app/settings`, `/app/help` | 7 real-time alert types, plan limits/quotas, upgrade flow, shop/receipt/MoMo settings |
| **AI & Wallet (Phase 7)** | `/app/assistant`, `/app/wallet` | Guardrailed AI Q&A (Enterprise); Business Banking (`With partner` until licensed) |

---

## 5. Phased Execution Roadmap

Every phase ends with: `npm run lint` + `npm run typecheck` + `npm test` + `npm run build` + rendered viewport check (`360px / 375px / 412px / 1440px`), followed by a **GitHub commit & push** to `okechbrian/kan` and a `HANDOFF.md` update. Each phase waits for user sign-off before the next starts.

| Phase | Scope | Deliverables | Owner Input Needed |
|---|---|---|---|
| **Phase 0** | Housekeeping & Spec | Verify & commit uncommitted **R9 Wave 3**; add `.eslintignore`; add `.github/workflows/ci.yml`; record D48–D50 in `DECISIONS.md`; update stale `HANDOFF.md` / `README.md` / `LOCKED_PLAN.md` | None |
| **Phase 1** | Kan Brand System & UI Kit | Tailwind tokens (Navy/Teal/Guava/Soft White), Noto Sans (`next/font`), `tabular-nums` money formatting, 3 SVG wordmark variants + favicon/PWA icons/OG image, `lucide-react` icons replacing raw symbols, shared UI kit (`Button`, `Card`, `Badge`, `StatCard`, `Modal`, `Tabs`, `DataTable`, `Input`) | None |
| **Phase 2** | Full Public Website (14 Pages) | Mega-dropdown header, Pwata Inc footer, shared bottom funnel, interactive Demo Hero dashboard, all 14 pages with converted UGX pricing & Uganda copy, working Contact / Newsletter / Account Deletion APIs | None (UGX prices & Pwata Inc details locked) |
| **Phase 3** | Supabase Cloud & Auth | Provision new Supabase Postgres project; Prisma migrations (existing + Expense/Purchase/Booking/Production/Lead models); set Vercel `DATABASE_URL`; tenant isolation + tests; live sign-up, login, password reset, create business, branch switcher, till pairing | **Create Supabase project / approve CLI login** |
| **Phase 4** | Live Merchant Dashboard & Core Tools | Live KPI Dashboard + 7-day chart + alerts; Products (single, bulk CSV, branch copy, publish online); Transactions (store/online/service + refunds); Reserved Orders; Customers & deni; Staff & activity; Expenses; Purchases & Suppliers; Warehouse | None |
| **Phase 5** | 12 Analytics Reports, Store, Bookings & Production | All 12 `/app/analytics/*` reports with charts & CSV/print export; Live Online Store (`/shop/[slug]` real orders → inbox + Discover); Notifications centre; Bookings calendar; Production/Recipes UI; Subscription quota enforcement | Optional: SMTP/SMS provider |
| **Phase 6** | Offline Till Reskin & Multi-Shop Sync Sign-Off | Apply Kan brand (navy/teal/guava, Noto Sans, black receipt logo) across `/pin`, `/sell`, `/stock`, `/customers`, `/shift/*`, `/more/*` (all 49 till tests green); verify 2-device offline sale → sync + multi-shop isolation on live Supabase | Second phone for live sync test |
| **Phase 7** | Uganda Payments, AI Assistant & Launch Ops | MTN MoMo / Airtel Money collection or Flutterwave Uganda webhooks; Guardrailed AI Assistant; Wallet (`With partner`); PWA/Android/Windows packaging, backups, monitoring, security review | Payment merchant keys, LLM API key, app-store accounts |
