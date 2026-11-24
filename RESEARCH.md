# Research — what actually works for Ugandan shops (Sep 2026)

This note is why we dropped pure A / B / C. Sources are listed at the bottom. Planning chat must not invent “Uganda facts” that contradict this file.

## 1. Who we are building for

Uganda’s private economy is MSMEs: about **90% of private-sector jobs**, a fifth of GDP. Wholesale and retail (dukas, hardware, market stalls) are about **a third of registered businesses**. Most of these firms are tiny: studies around Kampala trading centres find **~72% employ fewer than three people**, including the owner.

They fail from cash, not from lack of a website. UBOS-linked work puts **30%+ of registered SMEs dying within three years**, with **illiquidity** as a main cause. In trade, distress tracks **slow inventory** and **uncollected credit** (deni sitting too long). Owners also raid the till for school fees and fuel; that “ATM habit” is a documented reason a first shop never becomes a second.

**Implication:** the product must make cash, stock, and deni visible the same day. A pretty dashboard that needs a bookkeeper will not be used.

## 2. How a Ugandan duuka really runs

| Reality | What it means for software |
|---|---|
| Exercise book + memory | Replace the book, do not add a second one |
| Cash + MTN/Airtel MoMo, often split | Manual tenders in v1; Collection API later |
| Customer credit (“deni”) is normal | First-class ledger, or keepers stay in the book |
| Owner draw is normal | Record it; do not moralise it away |
| Attendants sell; owners are often away | PIN, no silent voids, close-of-day variance |
| Shrinkage / “okulya” (eating stock) | Industry notes **5–15%** of stock value lost a year in poorly controlled SMEs. Unrecorded sales are the classic leak |
| Second shop is how they grow | Not more cashiers in one room — another lock-up in another trading centre, often run by a relative |
| Owner cannot stand at two counters | Multi-shop is an **owner-away** problem, not a fancy ERP problem |

Growth path we design for:

```
one busy grocery → hire attendant → owner opens shop 2
→ owner watches both from a phone/laptop → maybe shop 3
```

Jinja hardware example in local press: owner who stopped treating the till as an ATM grew to **three branches with managers**. That person is our later customer. The person still at one counter is our first customer. Same product.

## 3. Devices, data, power — why cloud-only dies

- **Phones, not PCs.** UCC (2025–26): tens of millions of SIMs, on the order of **19–25 million smartphones**, but **adult smartphone adoption ~35%** (Kenya ~70%). Entry smartphones are expensive relative to income. The till is a Tecno/Infinix, not an iPad.
- **Internet is there on the map, flaky in the shop.** ~96% 4G coverage, but **active mobile internet** is much lower (~17–20 million). Data costs. Signal drops in containers and markets.
- **Power cuts are normal.** After the Umeme → UEDCL handover (Apr 2025), **74% of surveyed firms** cited a surge in interruptions. Manufacturers report **4–7 outages a week**. Shops lose evening hours; phones go to battery.
- **MoMo and data go down together.** MTN had a **multi-hour nationwide outage** (Jul 2026) hitting voice, data, and MoMo. A 2026 internet shutdown froze digital payments for traders who live on MoMo float.

**Implication:** if a sale requires the cloud, the shop reverts to the book on the worst days — and never comes back. Offline till is not a nice-to-have. It is the product.

WhatsApp and MoMo still matter, but they are **not available in those hours**. The till must be.

## 4. WhatsApp is the customer OS, not the till

In Ugandan SME surveys WhatsApp is the **#1** social/business channel (one 2024 sample: **51%**). Keepers already: send price lists, take orders, collect MoMo screenshots, coordinate bodas, nag deni.

That is Approach B’s strength — and its limit:

- A grocery rush is 8–20 seconds per basket. WhatsApp round-trips lose the queue.
- Free-text “sold 2 sugar” mis-records money.
- Meta API + verification is an ops trap.
- An attendant who must *remember to message the bot* can still pocket cash.

Local products that understand this (e.g. SmartDuka) use WhatsApp for an **end-of-day summary to the owner**, not as the cash register.

**Implication:** B is a **channel** (evening SMS/WA digest, later deni nudge). It is not the system of record.

## 5. EFRIS / URA — do not lead with tax

EFRIS is real, expanding, and politically radioactive (trader protests, shop closures, presidential walk-backs on mandatory fiscal machines). URA offers a **phone app that can work offline up to 5 days**. VAT and some sectors must comply.

Most **small grocery dukas are not VAT-registered**. Keepers fear that a digital sales book is a gift to URA. If v1 opens with EFRIS, informal shops will refuse to type a single sale.

**Implication:** EFRIS is a later module for shops that already have a TIN and ask for it. v1 is the private book: stock, till, deni. Never market v1 as “URA will see everything.”

## 6. What the local POS market already agrees on

Kampala is full of POS products: Maduuka, Smart Duuka, SmartDuka, Duukaz, ATIS, AcoPOS, ShopOS, UgaPOS, AIMduka, Zentro, Duuka.app, Veridian Duka360, and others.

They **converge** on the same pitch, because the market trained them:

1. Offline POS that syncs later  
2. MTN + Airtel as tenders  
3. Multi-branch owner dashboard  
4. Android / browser, not Windows tills  
5. Prices in UGX  
6. Credit/debt on the customer  
7. Staff PIN  

Paid plans cluster around **UGX 50,000–200,000/month**.

**Implication for us:** we are not inventing a category. We are choosing a **thin, grocery-first** version of what already works, that a builder agent can finish. We do **not** compete by adding payroll, hotel PMS, AI, and EFRIS on day one. Those products are wide and often shallow. Ours should be narrow and used every hour.

## 7. Verdict on A, B, C

| Approach | What is true in Uganda | What fails |
|---|---|---|
| **A — Offline POS** | Correct till. Correct device. Correct outage story. | One shop / one phone cannot serve an owner with two dukas, or a laptop + attendant |
| **B — WhatsApp books** | Correct for orders, suppliers, deni reminders | Wrong for a busy counter, stock math, and outages |
| **C — Fat multi-tenant SaaS** | Correct that many shops share one owner | Wrong if internet-first, three apps, billing, URA, before a sale works |

**What works:** A’s counter + C’s many shops + B as a later WhatsApp channel.

That is the locked product. See `LOCKED_PLAN.md`.

## 8. Sources (selected)

- Nile Post / BoU-linked SME credit and jobs (2026): MSMEs ~90% of private jobs; retail share; credit gap  
- UBOS / academic WCM papers: SME failure and receivables/inventory distress  
- UCC market reports 2025–26: SIMs, smartphones, mobile internet, MoMo subscriptions  
- MicroSave MSME digitalisation assessment (2025): internet ~28%, MoMo-heavy, WhatsApp/Facebook for informal sales, device cost  
- EPRC Business Climate (2025) + Observer/Monitor: UEDCL-era outages (74% of firms; 4–7/week)  
- MTN outage coverage Jul 2026; CIPESA 2026 internet-shutdown cost to traders  
- URA EFRIS handbook; Monitor on trader protests and EFRIS expansion  
- IGC retail/storage work: stockouts several times a week among market retailers  
- Local POS product sites (Maduuka, ATIS, AcoPOS, ShopOS, SmartDuka, UgaPOS, Zentro)  
- EliteTeq / Ficos / Novas notes on shrinkage, okulya, multi-branch blindness  
- Nile Post “owner as ATM” / Jinja three-branch hardware story  
- Makerere / JRIIE SME social-media study: WhatsApp dominant channel  
