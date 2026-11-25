# UI map — Kan

This file has two parts:
- **Part A (R1, new):** Kan public site + dashboard shell. These are the screens to build now.
- **Part B (preserved):** the offline till screens. Unchanged except the brand name in copy; reused from R3 onward.

Full scope: `KAN_SCOPE.md`. Decisions: `DECISIONS.md` D40–D47.

---

# PART A — Kan public site + dashboard shell (R1)

Viewport **360×800 first**, then 375, 412, desktop. Tap targets ≥44px. High contrast, readable outdoors. English only.

**Honesty rule:** no invented revenue, orders, customers, testimonials or charts. Every unbuilt feature is labelled `Coming soon` or `With partner`. Dashboard panels show real empty states with a next action.

## A0. Public marketing

| Route | Sections / copy |
|---|---|
| `/` | Sticky header (Kan mark; Features, Supported businesses, Pricing, Devices, Help; `Open your till` → `/pos`, `Go to dashboard` → `/app`). Hero: eyebrow `Built for Ugandan shops`, H1 `Your shop, in one place.`, subhead, two CTAs, dashboard preview mock with **empty** panels. Pillars grid (POS, Stock, Deni, Payments, Online store, Analytics) with state badges. `One platform` module strip. `Supported businesses` teaser. Pricing teaser. Download buttons marked `Coming soon`. Refer-a-friend + newsletter marked `Coming soon`. FAQ via `<details>`. Footer with legal links. |
| `/features` | Full module list from `KAN_SCOPE.md` §2.3 with state badges and one-line honest descriptions. |
| `/supported` | 16 verticals with state badges; no invented outcomes. |
| `/pricing` | Five tiers (Basic, Growth, Scale-Up, Premium, Enterprise) with staff/branch/SKU caps; monthly/quarterly/6-month/yearly toggle UI; **indicative** UGX prices clearly marked; trial + cancel copy. |
| `/devices` | Cash register, thermal printer, barcode/QR scanner, cash drawer; specs; prices `On request`. |
| `/help` | FAQ (what is Kan, web vs download, trial, cancellation, staff activity) + contact `hello@kan…` placeholder marked to confirm. |
| `/privacy`, `/terms`, `/merchant-terms`, `/account-deletion` | Own-written copy; `[legal entity to be confirmed]` as an explicit placeholder. |

## A1. Dashboard shell (`/app`)

Shared chrome: desktop sidebar + mobile top bar. Nav: Dashboard, Products, Orders, Customers, Reports, Shops, Staff, Billing, Settings. Each page: title, one-line purpose, state badge, and a real empty-state panel.

| Route | Empty-state copy |
|---|---|
| `/app/dashboard` | `No sales recorded yet. Open your till to begin.` |
| `/app/products` | `No products yet. Add stock from the till.` |
| `/app/orders` | `No online orders yet. Your storefront opens with the online store release.` |
| `/app/customers` | `No customers yet. Credit customers are added on the till.` |
| `/app/reports` | `Reports appear after the first closed shift.` |
| `/app/shops` | `One shop connected. Add branches when the platform opens.` |
| `/app/staff` | `Staff accounts open with the platform release.` |
| `/app/billing` | `Billing opens with the platform release. Prices shown on /pricing are indicative.` |
| `/app/settings` | `Settings are managed on the till for now.` |

Sign-in is **not** faked: the shell shows `Accounts open with the platform release` and a link back to the till. If auth lands in R2, replace this honestly.

---

# PART B — offline till screens (unchanged, brand renamed)

Builder: implement screens in this order. Do not add screens that are not listed.

Viewport: **360×800 first**. Owner laptop is the same UI, wider layout allowed on reports only. Sell screen stays a phone layout even on a laptop (centered, max-width ~420px) so the owner can demo the till.

Language: **English only**.

---

## Chrome (every authenticated screen)

**Top bar**

- Shop name (left). Owner with 2+ shops: name is a tappable switcher (Phase 7). Attendant: plain text, no switcher
- Offline/online pill (right): `Offline` / `Syncing` / `Synced`
- If shift is open: small `Till open` text

**Bottom nav (4 items, always)**

| Tab | Route | Who |
|---|---|---|
| Sell | `/sell` | both |
| Stock | `/stock` | both |
| Deni | `/customers` | both |
| More | `/more` | both |

Active tab is obvious. Attendant does not see owner-only buttons inside pages; they still see all four tabs.

---

## 0. First run — `/setup`

Shown if local DB has no shop.

**Create business (device 1)**

- Business / owner name
- First shop name (e.g. Nateete)
- Owner PIN (4–6 digits) + confirm
- MoMo number for this shop (optional, `07xxxxxxxx`)
- Primary button: `Create shop`

Then: show a **Shop code** (e.g. `NATEETE-4K2P`) and say:

> This phone is the till for this shop. To watch from a laptop, open Duuka and Join with this code. To add another shop later: More → Shops.

Buttons: `Copy code` · `Continue to till`

**Join shop (device 2)**

- Shop code
- Owner PIN
- Button: `Join shop`
- Requires network. On success, pull data and go to PIN.

Do not allow two different shops in one browser profile.

---

## 1. PIN — `/pin`

- Shop name
- Numpad 0–9, backspace
- 4–6 digit PIN
- On success → if no open shift, `/shift/open`, else `/sell`
- 5 wrong tries: 30s wait (no cloud lockout in v1)
- Link: `This is not my shop` → confirm wipe local (does not delete server)

---

## 2. Open shift — `/shift/open`

- Field: Opening float (UGX integer, default 0)
- Helper: `Cash you put in the box for change`
- Button: `Open till`
- After open → `/sell`

Cannot sell without an open shift.

---

## 3. Sell — `/sell` (most important screen)

### Layout

1. Search box: `Find item` (filters as you type)
2. **Fast movers**: 2-column grid of large tiles  
   Tile: product name, selling price (`UGX 5,000`), optional qty badge if stock ≤ 5 (orange) or 0 (still sellable)
3. Other products: list below if search is empty (name + price). Searching filters everything.
4. **Cart sheet** (bottom, always visible when cart has items)

### Cart

- Lines: name, qty stepper (− 1 +), line total
- Remove line
- Total (big)
- Button: `Charge UGX 18,500`

### Pay sheet (modal)

- Total
- Tender buttons: `Cash` `MTN` `Airtel` `Credit` `Split`
- **Cash:** amount tendered (quick chips: exact, 1,000, 5,000, 10,000, 20,000, 50,000). Show change. Confirm `Record cash sale`
- **MTN / Airtel:** show shop MoMo number if set. Confirm `I received MoMo`
- **Credit:** must pick customer (search/create). Warning if they already owe. Confirm `Put on deni`
- **Split:** add 2+ tenders until remaining is 0. Credit still needs a customer.

Done → brief toast `Sold` → back to empty cart. Stay on `/sell`.

### Rules

- Tap tile adds 1 (or increments if already in cart)
- Stock 0: tile still works, small warning `Stock not counted`
- No customer on cash/MoMo
- Attendant cannot change selling price in v1 (keep it simple). Owner price override is later.

---

## 4. Stock — `/stock`

- Search
- List: name, qty, unit, selling price
- Low stock (qty ≤ reorder, default 5) grouped at top, labelled `Low`
- Tap row → product detail (qty, prices). Owner can edit. Attendant read-only.
- Owner FABs or top actions: `Receive goods` · `Add product`

Attendant: no receive, no add, no adjust.

---

## 5. Receive — `/stock/receive` (owner)

- Add lines: pick product, qty in, unit cost (prefill last buying price, editable)
- Optional supplier text
- Confirm `Add to stock`
- Updates qty and last buying price
- Then back to `/stock`

---

## 6. Adjust — `/stock/adjust` (owner)

- Pick product
- New counted qty (not delta)
- Reason required: `Theft` `Breakage` `Count correction` `Other` + note if other
- Confirm. Writes a stock movement.

---

## 7. Products — `/products` (owner) and `/products/new`

Fields:

- Name
- Unit (select: pc, kg, g, l, ml, packet, dozen, sachet)
- Selling price (UGX)
- Buying price (UGX)
- Opening stock (only on create)
- Fast mover checkbox (appears on sell grid)
- Active checkbox

No SKU barcode field in v1.

---

## 8. Customers / deni — `/customers`

- Search
- List: name, phone, balance (hide zero-balance behind toggle `Show all`; default **who owes**)
- Add customer: name required, phone optional
- Tap → `/customers/[id]`

### Customer detail

- Name, phone, balance
- `Collect` button
- Ledger list (date, sale/collection/void, amount)
- Collect sheet: amount, `Cash` / `MTN` / `Airtel`, confirm

---

## 9. More — `/more`

List of rows:

| Row | Who |
|---|---|
| Close till | both, if shift open |
| Today | both (attendant = this shift) |
| Who owes | both |
| Profit estimate | owner |
| Owner draw | owner |
| Products | owner |
| Receive goods | owner |
| Users & PINs | owner |
| Shop settings | owner |
| Backup | both (export always; import owner) |
| Pair another device | owner (shows this shop’s code) |
| Shops | owner (Phase 7: list, add shop, copy products) |
| Sync now | both |
| Lock | both |

---

## 10. Close till — `/shift/close`

Show:

- Opening float
- Cash sales
- Cash collections
- Draws
- **Expected cash** (big)
- Input: `Counted cash`
- **Variance** live: Exact / Short UGX X / Over UGX X
- MoMo recorded today (info only, not in the box)
- Credit sales today (info)
- Button: `Close till`

After close → `/pin` or a rest screen `Till closed` with `Open again`.

---

## 11. Owner draw — `/more/draw` (owner)

- Amount
- Reason (text, e.g. lunch, home)
- Confirm. Only cash leaving the till in v1.

---

## 12. Reports

**Today** — big numbers: sales total, count of sales, breakdown cash / MTN / Airtel / credit.

**Who owes** — same as customers default.

**Profit estimate** — labelled `Estimate (last cost)`. Not “net profit”. Number + 2-line explanation.

---

## 13. Settings — `/settings` (owner)

- Shop name
- MoMo number
- Reorder level default
- Shop code (read-only) + regenerate (careful, confirm)

**Users:** list name, role, active. Add attendant: name + PIN. Owner can reset attendant PIN.

---

## 14. Backup

- `Download backup` → JSON file `duuka-YYYY-MM-DD.json`
- Owner: `Restore backup` (replace local; then sync push)

---

## Empty states (write this copy)

| Screen | Copy |
|---|---|
| Sell, no products | `Add sugar, oil, soap before you can sell. Owner: More → Products` |
| Sell, no shift | `Open the till first. Enter the cash in the box.` |
| Deni, nobody owes | `Nobody owes the shop right now.` |
| Stock empty | `No items yet. Receive goods or add a product.` |
| Offline | `You can still sell. We will send this when the network is back.` |

---

## 15. Owner shops — `/shops` (Phase 7, owner)

- List shops: name, today’s sales, till open/closed
- Tap row: switch current shop, go to `/sell` or `/reports/today`
- `Add shop`: name, copy products from [dropdown], create, show new shop code
- Empty: `You have one shop. Add another when you open a second duuka.`

## 16. Owner home when 2+ shops — `/home` (Phase 7)

Owner with one shop still lands on `/sell`. Owner with two+ shops, on laptop, lands here:

- Grand total today (big)
- One row per shop: name, sales, cash, MoMo, deni outstanding
- Tap row → that shop’s today

Attendant never sees `/home`.

## 17. Batches & expiry — `/stock/batches` (R3, owner)

- List batches for this shop: product, quantity, expiry date, status badge (`no_expiry` / `expired` / `expiring` / `ok`)
- Empty: `No batches yet. Receive goods with an expiry date to see them here.`
- FIFO allocation is used when selling batch-tracked products; expiry never blocks a sale.

## 18. Move stock — `/stock/transfer` (R3, owner)

- From shop / To shop selects, product line list with quantity
- Validate: no same-shop, no empty lines, no duplicate products, positive integer quantities
- Save as `pending`; local stock is not silently mutated
- Warn when the source would go negative; never block
- Empty: `Add two shops before moving stock between them.`

## 19. Payments — `/more/payments` (R4)

- Lists methods with state badges: cash, MTN MoMo, Airtel Money, credit and split are `Available now`; bank transfer, card, gift card and crypto are `Coming soon`.
- Shows totals by method from local tenders (integer UGX).
- Empty: `No payments recorded yet. Complete a sale to see totals here.`
- Manual confirmation only: no card data, gateway credentials or bank connection.

## 20. Storefront preview — `/shop/[slug]` (R5)

- Public, path-based storefront on the main Vercel app (no DNS needed).
- Header with shop name and `Coming soon` badge; honest note that browsing works offline but orders are not sent.
- Product grid from the published catalogue (active, unexpired), prices in UGX.
- Cart with quantity, delivery band (trading centre free / Kampala 5,000 / outside 15,000), phone entry and preview checkout that builds a local order but sends nothing.
- Empty: `No products on this storefront yet. Add products on the till first.`

## 21. Channels — `/app/channels` and `/discover` (R6)

- `/app/channels`: online store `Available now`; social store, marketplace connector and Discover Merchants `Coming soon`; working share links to WhatsApp/Facebook.
- `/discover`: public preview directory with search over shops on this device; each result links to its `/shop/[slug]` storefront; `Coming soon` badge explains the public directory opens with cloud sync.
- Empty: `No shops match yet. Add a shop on the till to see it here.`

## 22. Reports and alerts — `/app/reports` and `/app/alerts` (R7)

- `/app/reports`: sales total, count, average basket, daily sales for the last 7 days, by payment method, top products and profit estimate (last cost minus recorded expenses). Honest note that figures come from this device.
- `/app/alerts`: counts and lists for low/out-of-stock, expiring/expired batches and customers with old deni balances, with links to the relevant till screens.
- Empty: `No closed sales yet.` / `Nothing low in stock.` / `No old balances to follow up.`

## 23. Install and hardware — `/more/install`, `/more/hardware` (R8)

- `/more/install`: PWA `Available now` with Add-to-Home-screen steps; Android/iOS/Windows `Coming soon`; warning that clearing browser data deletes local books until backup/sync.
- `/more/hardware`: barcode/QR scanner `Available now` as an optional keyboard wedge; printer, drawer and touchscreen `Coming soon`. No hardware is required to sell.
- `/offline`: honest fallback page with an `Open the till` action.

## 24. Business type — `/app/verticals` (R9 wave 1)

- Three wave sections with all 16 business profiles; wave 1 `Available now`, waves 2–3 `Coming soon`.
- Wave 1 profiles can be selected and saved on this device; suggested starter items are shown with an honest note that they are only added when entered on the till.
- Empty starter list for planned profiles unless their workflows are built.

## 25. Wave 2 preview — `/app/verticals/wave2` (R9)

- Honest banner: helpers are built and tested but not enabled in the till; nothing changes stock or books an appointment.
- Live demo tools: pharmacy batch dispensing (expired batches skipped), bakery recipe scaling, salon free-slot count and laundry ticket flow.
- Linked from `/app/verticals`.

## 26. Wave 3 preview — `/app/verticals/wave3` (R9)

- Honest banner: helpers are built and tested but not enabled in the till; they do not create production runs, warranties or deliveries.
- Live demo tools: factory BOM with shortfalls, production batch code, serial validation with warranty expiry, and delivery quote with next state.
- Linked from `/app/verticals`.

## 27. AI, banking and support — `/app/ai`, `/app/banking`, `/support` (R10–R11)

- `/app/ai`: `With partner` state; asks are guarded and answered with an honest safe fallback while no model key is configured; crisis input is handled before any model call.
- `/app/banking`: every feature `With partner`; no balances, transfers or wallet numbers are shown.
- `/support`: short counter-focused help, links to legal/data pages, contact marked `[to be confirmed]`.

## Kan-era UI note

The original "do not build" list below was retired by D40–D47: the marketing site, dashboard shell, barcode support, optional printing and inter-shop transfers are now in `KAN_SCOPE.md`. Still not in the UI: dark mode toggle, language switcher, attended email login, EFRIS, and a required barcode/printer.

## What not to build in the UI (retired list, kept for history)

- ~~Landing/marketing page~~ — built in R1
- Charts — later (R7)
- Dark mode toggle
- Email fields for attendants
- Language switcher
- Printer dialogs — optional hardware later
- ~~Barcode scanner~~ — optional in R3
- ~~Stock transfer between shops~~ — built in R3
- Shared customer across shops
