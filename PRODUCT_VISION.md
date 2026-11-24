# Product Vision — Kan

**Supersedes:** the Duuka-only vision (2026-09-02). See `DECISIONS.md` D40–D47.

## One sentence

Help a Ugandan shopkeeper run the counter, stock, cash and credit book from a phone — even offline — then give them a storefront, payments and insight as their business grows.

## The problem

Most dukas still run on an exercise book, memory for stock, a cash box mixing shop and home money, and trust that the attendant recorded every sale:

| Loss | What happens |
|---|---|
| Leakage | Attendant sells and does not write it down |
| Dead stock | Money sits in slow items; fast movers run out |
| Uncollected deni | Neighbours owe, nobody follows up |
| Fake profit | Cash in the box is mistaken for profit |
| No close | End of day and morning float are guesses |

Generic POS/ERP tools assume a computer, stable power, stable internet, accounting literacy and a barcode scanner.

## Who it is for

**Primary (unchanged):** owner of a small Ugandan shop — one lock-up now, often a second later; owner plus 0–2 attendants; Android phone, rarely a laptop; FMCG mixed basket; cash and MTN/Airtel money; credit to regulars; not VAT-registered.

**Secondary (later):** mini-supermarket, pharmacy, bakery, salon, restaurant, agro shop, factory — see the 16 verticals in `KAN_SCOPE.md` §4/WS-10.

**New in Kan:** the walk-in **customer** becomes a user from R5 — they browse a storefront and place an order. That does not change the till's phone-first, PIN-only attendant experience.

## Jobs to be done

1. Sell fast, offline — tap, take money, sale recorded, stock drops.
2. Know what is left before sending someone to wholesale.
3. Know who owes (deni) and follow up.
4. Close the day: expected cash vs counted, MoMo vs recorded.
5. See real profit estimate — sales minus cost, minus draws.
6. Catch leakage the same evening.
7. See shop 2 without driving there.
8. (Later) Let a customer find the shop and order online.
9. (Later) Accept digital payments and see trends.

## Constraints that are not optional

- UGX **integer**; never floats. Display with thousands separators.
- Offline-first: a failed fetch never blocks a sale.
- Phone-first: thumb-sized targets, outdoor contrast, 360px first.
- Attendant **PIN**, not email. No required barcode, printer or GPS.
- Negative stock allowed with a warning; credit requires a customer.
- Owner draw is a normal event. Void is owner-only and reverses stock/deni.
- `business_id` + `shop_id` on every business row. Backup export/import is v1.
- **No invented proof**: no fake testimonials, counts, charts or balances.
- Banking, crypto and AI: partner or defer, never fake.

## Success

- **R1:** public site live and honest; shell routes guarded; 0px mobile overflow.
- **Platform:** a second tenant is isolated; an offline sale still works after cloud features land.
- **Commerce:** a real buyer orders from a shared storefront link.
- **Original field success still stands:** one real duuka uses the till for 7 continuous selling days without the exercise book.

## Non-goals until explicitly unlocked

EFRIS/URA, payroll/NSSF, double-entry accounting, multi-currency, in-house banking, crypto custody, required barcode/printer, WhatsApp as the cash register. AI stays behind tenant isolation and guardrails.

## Positioning

| We are | We are not |
|---|---|
| The shop's one place: till, books, later the storefront | An ERP for an accountant |
| Honest about cash, deni and variance | A vanity dashboard with invented numbers |
| Built for a busy Ugandan counter | A generic Western retail clone |

Tagline (default, changeable): **"Kan — your shop, in one place."**
