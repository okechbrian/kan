# Kan × Konna Parity Master Plan (Uganda)

**Active execution rule (D53, 2026-11-26):** Follow the sequential completion plan in `IMPLEMENTATION_PLAN.md`. Full Konna parity remains the goal. Exactly one step/substep may be active. Next: Step 01, the verified feature inventory; no application build is started by this planning task. Earlier current-phase/start commands are historical where they conflict with D53.
**D52 reaffirmation (2026-11-26):** Full tool parity is the product target. The smaller grocery MVP is only an interim milestone. Prior phase-complete claims are withdrawn; screens, schemas and helpers require end-to-end acceptance evidence. Current public-site recheck confirms online store/catalogue sync, payment channels, inventory and specialist business capabilities remain relevant. The authenticated dashboard has not been exhaustively re-walked in this session.

**Date:** 2026-11-25  
**Product:** **Kan** — a product of **Pwata Inc**  
**Repository:** `https://github.com/okechbrian/kan`  
**Live Deployment:** `https://kan-sme.vercel.app`  
**Reference Studied:** `konna.io` (all 14 public pages), `app.konna.io` (45+ app routes), Konna public tutorials, and `Kan-Brand-Guidelines.pdf` (v1.0).

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
