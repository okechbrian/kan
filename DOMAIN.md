# Domain — How a Ugandan duuka actually works

A builder agent must implement this domain, not a generic “inventory + POS” tutorial.

## Glossary

| Term | Meaning |
|---|---|
| Duuka / duka | The shop |
| Keeper / owner | Person who owns the shop and the money |
| Attendant | Person at the counter (may be the owner) |
| Till | Cash in the box / drawer. Not the same as profit |
| Float | Cash put in the till at the start of a shift |
| Close / closing | End of day (or end of shift): count cash, compare to expected |
| Variance | Counted cash minus expected cash. Short or over |
| Deni | Credit. Customer takes goods now, pays later |
| Fast mover | Item that sells often (sugar, oil, soap, soda) |
| Dead stock | Item that sits |
| Cost / buying price | What the shop paid the wholesaler |
| Selling price | What the customer pays |
| Owner draw | Owner takes shop cash for personal use |
| Restock / receiving | Goods arriving from wholesale into the shop |
| MoMo | Mobile money (MTN or Airtel). Often the owner’s personal number |
| Shift | One attendant session on the till |
| SKU | One sellable item (e.g. “Sugar 1kg”) |
| Unit | How it is sold: pc, kg, litre, packet, dozen, sachet |
| Business | The owner’s account. Can contain many shops |
| Shop / branch | One physical duuka with its own till, stock, deni, and float |
| Okulya | Staff “eating” stock — unrecorded sales or goods walking out |

## A day in the shop (v1 must support this)

### Morning

1. Owner or attendant opens the shop.
2. Puts float in the till (e.g. 50,000 UGX for change).
3. Starts a shift on the phone (PIN).
4. Looks at low-stock items if they are sending someone to wholesale.

### During the day — sell

Typical sale, 8–20 seconds:

1. Customer asks for items (often shouted, mixed basket).
2. Attendant finds items on screen (search or big buttons / photos for fast movers).
3. Sets quantities.
4. Sees total in UGX.
5. Customer pays with **one** of:
   - Cash (maybe needs change)
   - MoMo (customer sends to a number; attendant marks as MoMo)
   - Split (part cash, part MoMo) — **v1 should support split**
   - Deni (known customer; attendant picks customer, sale goes to their balance)
6. Stock for each item drops.
7. Optional: show a simple on-screen receipt. Printing is not required.

**Busy-counter rule:** the happy path is tap-tap-done. No typing a paragraph. No required customer name for cash sales.

### During the day — other events

- **Receive stock:** owner comes from Kikuubo with boxes. Enters what arrived and what it cost. Stock goes up. Buying price may update.
- **Adjust stock:** counted 8 soaps on shelf, system says 11 → record a loss/breakage/theft adjustment with a reason.
- **Owner draw:** owner takes 20,000 for lunch. Till expected cash drops. This is not a sale and not an expense line that should look like “profit disappeared mysteriously”.
- **Expense:** airtime for the shop phone, boda to wholesale, small repairs. Optional in v1; owner draw + stock cost cover a lot. If expenses exist, they are simple: amount, reason, payment method.
- **Collect deni:** customer pays 10,000 toward what they owe. Cash or MoMo. Balance drops. Not a new sale.

### Evening — close

1. System shows expected cash in till (float + cash sales + cash deni collections − cash draws − cash expenses − change already accounted).
2. Attendant counts notes and coins, enters counted amount.
3. System shows variance (short / over / exact).
4. System shows MoMo recorded today (cannot count MoMo from the box; it is a report).
5. Shift ends. Next morning starts with a new float (or leftover cash becomes tomorrow’s float — owner chooses).

If closing is skipped, the system still has the sales. Closing is how leakage becomes visible.

## Credit (deni) rules

Deni is how many dukas keep customers. It is also how they go broke.

v1 rules:

- A customer is a **name + optional phone**. Phone is strongly encouraged.
- Cash sales do **not** require a customer.
- Credit sales **require** a customer.
- Each customer has a running **balance** (integer UGX they owe the shop).
- A credit sale increases balance. A collection decreases it.
- Owner can see: who owes most, who has not paid in N days.
- v1 does **not** need interest, instalment plans, or SMS reminders (reminders are a later channel).
- v1 does **not** need a hard credit limit, but a simple “this person already owes X” warning on credit sale is good.

Do not model deni as a separate app. It is a payment type and a customer ledger.

## Stock rules

- Stock is **quantity on hand** per SKU, in the SKU’s unit.
- Selling reduces stock. Receiving increases it. Adjustments can go either way.
- **Allow negative stock in v1?** Yes, with a warning. Real dukas sell items they forgot to receive into the system. Blocking the sale trains them to abandon the app.
- Buying price is stored per SKU (last cost). Optional later: cost per batch. v1 last-cost is enough to estimate profit.
- Selling price is stored per SKU. Attendant may override price on a sale (some dukas bargain; some never do). Log the override.
- No warehouse vs shop split in v1. One shop, one stock number.
- Expiry dates are **not** v1 (needed later for milk, bread, pharmacy).

### Units

Use a small fixed list:

- `pc` (piece)
- `kg`
- `g`
- `l` (litre)
- `ml`
- `packet`
- `dozen`
- `sachet`

Do not allow free-typed units in v1. Conversion (sell 500g from a 1kg bag) is **not** v1. Each sellable pack is its own SKU (`Sugar 1kg`, `Sugar 500g`).

## Money rules

- Currency: **UGX**
- Storage: **integer shillings** (50,000 not 50000.00)
- Display: `UGX 50,000` with thousands separators
- Never use JavaScript floating point for money
- Payment methods in v1: `cash`, `mtn_momo`, `airtel_money`, `credit`
- A sale may have **multiple tenders** (split pay) that sum to the total
- Change given is only for cash. Record `amount_tendered` and `change` on cash tenders
- MoMo in v1 is **manual confirmation** (attendant marks it received). No MTN Collection API required for v1. The number to send to can be shown on screen (shop MoMo number in settings)

## Roles

| Role | Can do |
|---|---|
| Attendant | Bound to **one shop**. Open shift, sell, collect deni, view own shift totals. Cannot change buying prices, cannot see full profit, cannot delete sales, cannot see other shops |
| Owner | Business-level. Everything attendants can **in any shop they pick**, plus products, prices, receiving, adjustments, draws, expenses, all reports, user PINs, close any shift, void a sale, add shops |

v1: one **business**, many **shops**, many users. Each user has a PIN (4–6 digits). A till device is paired to exactly one shop.

## Many shops (v1 rules)

Ugandan owners grow by opening another lock-up, not by adding lanes. The owner is then away. That is why leakage explodes at shop 2.

- Each shop has its own stock, float, shifts, sales, deni customers, MoMo number
- Creating shop 2 **copies** product names/prices from a chosen shop; quantities start at 0 until receive
- **No stock transfer** between shops in v1 (write a receive at B and an adjust at A if they move a crate by boda)
- Customers are per shop
- Owner home screen: today’s total per shop + grand total, then tap into one shop
- Attendant UI never offers a shop switcher

Do not implement many shops until the single-shop till (phases 1–5) and sync (phase 6) work. See `LOCKED_PLAN.md`.

Voiding a sale: owner-only, reason required, stock returns, deni reversed if it was credit. Do not silently delete.

## Core entities (logical)

These names should appear in code and docs. Do not invent parallel names.

```
Business
  id, name, created_at

Shop
  id, business_id, name, shop_code, momo_number, currency=UGX, active

User
  id, business_id, shop_id (null for owner), name, role (owner|attendant), pin_hash, active

Device
  id, shop_id, token_hash, label, last_seen_at

Product
  id, shop_id, name, unit, sku_code (optional),
  selling_price, buying_price, stock_qty,
  is_fast_mover, photo_url (optional), active

Customer
  id, shop_id, name, phone (optional), notes, balance

Shift
  id, shop_id, user_id, opened_at, closed_at,
  opening_float, counted_cash, expected_cash, variance, status (open|closed)

Sale
  id, shop_id, shift_id, user_id, customer_id (nullable),
  created_at, status (completed|voided), void_reason,
  total, note

SaleLine
  id, sale_id, product_id, qty, unit_price, line_total,
  buying_price_snapshot (for profit later)

Tender
  id, sale_id, method (cash|mtn_momo|airtel_money|credit),
  amount, amount_tendered, change

StockMovement
  id, shop_id, product_id, type (sale|receive|adjust|void),
  qty_delta, reason, user_id, created_at, ref_id

Receive
  id, shop_id, user_id, created_at, supplier_name (optional text),
  note

ReceiveLine
  id, receive_id, product_id, qty, unit_cost

DeniLedger
  id, shop_id, customer_id, type (sale_credit|collection|void),
  amount, sale_id (optional), user_id, created_at, note
  # customer.balance is the sum of this ledger (or maintained in sync)

CashMovement
  id, shop_id, shift_id, type (draw|expense|collection_cash|…),
  amount, reason, user_id, created_at
```

Keep `business_id` + `shop_id` on records from day one even while Phase 1 seeds a single demo shop. Many-shop UI is Phase 7, not Phase 1.

## Reports v1 (only these)

1. **Today** — sales total, by payment method, number of sales
2. **Till close** — expected vs counted
3. **Stock** — quantity, low stock (below a simple reorder level, default 5)
4. **Deni** — list of customers with balance > 0
5. **Profit estimate** — sum of (unit_price − buying_price_snapshot) × qty for completed sales, minus expenses. Label it **estimate**, because last-cost is not true weighted average.

No charts required in v1. Tables and big numbers.

## What “automate workflows” means here

Automation is **not** AI. It is:

- Stock falling when you sell (no double entry in a book)
- Deni balance updating when you sell on credit or collect
- Expected till cash computed for you at close
- Low stock list instead of walking the shelves
- One PIN-separated log so the owner can see who sold what

If a workflow still needs a second notebook, v1 has failed.

## Explicitly out of domain v1

- Multiple shops / transfers between shops
- Supplier accounts payable (we record receive cost, we do not run a full AP ledger)
- Employee salaries
- Manufacturing / recipes
- E-commerce
- Customer loyalty points
- Barcode as the only way to sell (search + fast-mover grid is enough; barcode optional later)
