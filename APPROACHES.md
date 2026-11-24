# Three approaches (historical)

**Superseded 2026-09-02.** After Uganda research and the requirement for **multiple shops**, the live product is in `LOCKED_PLAN.md` (offline till + many shops, one PWA). This file stays so we remember why we rejected pure A, B, and fat C.

All three solve the same job: take a Ugandan duuka off the exercise book. They differ in **where the work happens**, **what must be online**, and **how fast a real shop can use it**.

---

## Shared principles (all approaches)

- UGX integers
- Cash + MoMo + deni
- Owner vs attendant
- Uganda phone numbers
- `shop_id` on records even if v1 is one shop
- Builder agent implements only what the locked approach’s v1 list says

---

## Approach A — Counter-first offline POS

**One line:** Replace the notebook at the till with a phone app that works with no internet.

### Who it is for

A busy grocery duuka. Attendant stands at the counter all day. Speed matters more than chat convenience.

### Shape

- **One** web app, installable as a PWA on Android (Add to Home Screen)
- Local database on the device (IndexedDB)
- PIN login
- Huge product buttons for fast movers, search for the rest
- Sync to a server is **phase 2**, not required to sell
- Owner can open the same app for reports, receiving, products

Optional later: wrap with Capacitor/TWA for a Play Store icon. Not v1.

### v1 scope

- Products, stock, receive
- Sales (cash / MoMo / split / deni)
- Customers + deni ledger + collections
- Shifts, float, close, variance
- Owner draw
- Today / stock / deni / profit-estimate reports
- Offline sales
- One shop, multiple PINs

### v1 not in this approach

- WhatsApp bot
- Native iOS
- Multi-tenant billing
- URA
- Receipt printer (design layout so a printer can be added)

### Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| UI | Next.js App Router + TypeScript + Tailwind | Matches how we already ship; one codebase |
| Client data | Dexie (IndexedDB) | Works in Chrome on Tecno/Infinix; no native toolchain |
| Auth | Local PIN, hashed | No email |
| Money | Integer UGX helpers | No floats |
| Hosting | Vercel (for the shell + later sync API) | First load needs net; after that service worker |
| Later sync | Postgres (Supabase or similar) + outbox table | Only after one shop survives a week offline |

**Do not** start with Expo + Express + Postgres + docker-compose. That is three apps before the first sale. DukaDrop used that shape because lockers need a server. A till does not.

### How a keeper uses it

1. Open Duuka on the phone (home screen icon)
2. Enter PIN
3. Enter float
4. Sell all day, including when MTN data dies
5. Close: count cash, see variance
6. When data is back, phase 2 will upload the day (not v1)

### Pros

- Fastest path to “used at a real counter”
- Honest about Uganda connectivity
- One codebase for a builder agent
- Maps 1:1 to the domain in `DOMAIN.md`
- Easy to add a cheap dedicated till phone

### Cons

- Must train the attendant (15 minutes, but real)
- PWA install on some Androids is awkward (need a simple install card in-app)
- Two phones (owner + attendant) do not share data until sync exists — **v1 is one-device-as-till**. Owner looks at that same phone, or we accept v1 is single-device.
- Browser IndexedDB can be cleared if the user is aggressive with “clear data”. Mitigate: “Do not clear Duuka data” warning + later backup export.

### Single-device rule (important)

Until sync is built, **the till phone is the book**. The owner does not have a live second copy. Document this in the UI. A JSON backup export/import in v1 is cheap insurance and should be included.

### When to choose A

- You can sit with one shopkeeper
- The pain is the counter, stock, and closing
- You want something usable in weeks, not a platform

### Time (one focused builder agent)

- Usable till on a phone: ~2–3 weeks
- One shop field test: week 4
- Sync (phase 2): another 1–2 weeks

---

## Approach B — WhatsApp-native operations

**One line:** The shopkeeper never installs an app. They message a WhatsApp number the way they already message suppliers.

### Who it is for

Owners who are not at a busy counter, or dukas with low transaction volume where typing “sold 2 sugar 15000” is acceptable. Also useful if the owner is away and the attendant can send a photo of the notebook — but that is weaker.

### Shape

- WhatsApp Cloud API bot (Meta)
- Backend holds the real books (Postgres)
- Owner (and maybe attendant) chat with the bot
- Tiny web dashboard for reports the chat cannot show well
- Optional: bot sends the owner a 7pm summary; later, deni reminders to customers

### Example flow

```
Attendant → Bot: sold sugar 1kg, oil 1L, cash 18500
Bot → Attendant: recorded UGX 18,500 cash. Sugar 12 left. Oil 7 left.

Owner → Bot: who owes
Bot → Owner: 1. Mama Aisha 45,000  2. Okello 20,000 …

Owner → Bot: low stock
Bot → Owner: Soap 3, Milk 2, Sugar 4
```

Natural language must be tightly constrained (templates / buttons / list messages). Free-form English/Luganda parsing will mis-record money. Use WhatsApp interactive lists for products, not GPT-as-POS.

### v1 scope

- Product list managed on a small web admin
- Log sale via WhatsApp lists + quantity
- Stock down, deni via picking a customer
- Daily summary message
- Owner commands: sales today, low stock, who owes

### Pros

- Zero install, zero Play Store, zero “add to home screen”
- WhatsApp is already the OS of Ugandan small business
- Owner can run the shop from afar (weak attendant still has to message honestly)
- Deni reminders to customers are natural later (they already have WhatsApp)

### Cons

- **Too slow for a busy counter.** A real grocery rush cannot wait for WhatsApp round-trips
- **Requires internet** on every sale
- Meta business verification, phone number, ongoing API cost
- Attendant can still skip messaging (leakage is easier than on a till in the hand)
- Ambiguous messages = wrong books (worse than no books)
- Not offline-first — fights `PRODUCT_VISION.md` constraints
- Builder agent + WhatsApp sandbox is ops-heavy (tokens, webhooks, ngrok)

### When to choose B

- The user is the owner, not a standing attendant
- Volume is low (hardware stall, spare-parts, made-to-order, agro inputs)
- You explicitly want “no new app”
- You are willing to be online always

### Time

- Bot + admin + basic ledger: ~2–3 weeks if Meta access is already approved
- Meta verification can block you for weeks — this is the hidden schedule risk

---

## Approach C — Multi-tenant SME SaaS

**One line:** A product company for many dukas: cloud POS, roles, billing, later URA, later branches.

### Who it is for

You, if the goal is a startup that sells subscriptions to hundreds of shops. Not the fastest way to help one keeper.

### Shape

- Expo (or PWA) till app
- Next.js owner/admin
- Postgres + auth + tenant isolation
- Hosted always; offline as a sync add-on
- Billing (monthly UGX via MoMo)
- Onboarding, support, staging, backups

This is DukaDrop-shaped: `mobile/` + `web/` + `backend/`.

### v1 scope (even “MVP” is large)

- Tenancy (one owner account, one or more shops)
- Invite attendants
- Cloud as source of truth
- POS + stock + deni + close
- Owner web reports
- Basic billing flag (even if you do not charge yet)

### Pros

- Builds the real business, not a one-off
- Owner phone and attendant phone stay in sync
- Path to hardware duka + mini-supermarket + pharmacy as verticals
- Easier to add URA, branches, accountant export later

### Cons

- Longest time to first real close of day
- Internet assumed (unless you still invest in offline sync — which is the hard part)
- Three codebases for a builder agent = drift and half-finished apps
- You will debug tenants, auth, and deploy before you debug whether a keeper will tap sugar
- High chance of overbuilding reports nobody asked for

### When to choose C

- You already have 5+ shops waiting
- You need two devices in sync on day one
- You are raising or selling this as a product immediately
- You accept 6–10 weeks before a trustworthy till

### Time

- Thin vertical slice (one tenant, sell + stock, always-online): ~4–6 weeks
- Offline sync + billing + hardening: not v1

---

## Comparison

| | A. Offline POS | B. WhatsApp ops | C. Multi-tenant SaaS |
|---|---|---|---|
| Counter speed | High | Low | High if online |
| Works offline | Yes | No | No unless extra work |
| Install | PWA | None | App + accounts |
| Devices in v1 | One till phone | Any WhatsApp phone | Many, if online |
| Training | 15 min till | Chat habits | Higher |
| Meta / API ops | None | Heavy | Medium |
| Leakage control | Best (till in hand) | Weak | Good |
| Time to first shop | 2–4 weeks | 2–3 weeks + Meta risk | 6–10 weeks |
| Builder-agent fit | Best (one app) | Medium | Worst (three apps) |
| Becomes a product later | Yes (add sync + tenancy) | Partial (chat is a channel) | Already is |
| Fits “small duuka” now | **Best** | Niche | Overkill |

---

## Recommendation

**Lock Approach A for v1.**

Reason, in order:

1. The pain is at the **counter**, not in a chat thread.
2. Offline is not optional in Uganda.
3. One PWA is what a second agent can actually finish.
4. The domain model already has `shop_id`. Approach C is an evolution (sync + tenancy + second device), not a rewrite, if A stays disciplined.
5. Approach B is a **later channel** (evening summary, deni reminder), not the book of record.

### Recommended sequence (if A is locked)

1. **v1** — Approach A, single device, backup export
2. **v1.1** — Field test in one Kampala/trading-centre grocery duuka, fix UX
3. **v2** — Cloud sync + owner can watch from a second phone
4. **v3** — Tenancy / charging (Approach C features)
5. **v4** — WhatsApp summary + deni nudges (Approach B as a channel)

### Anti-recommendation

Do not “take the best of all three” in v1. That produces a WhatsApp bot, a PWA, and a backend, none of which close the till.

---

## How to lock

Write the choice into `DECISIONS.md`:

```
Approach: A | B | C
Date:
Reason:
```

**Locked 2026-09-02 (revised same day):** not pure A/B/C. Live spec is `LOCKED_PLAN.md` (offline till + many shops). Do not implement WhatsApp POS or a three-app SaaS.
