# Sync — two devices, then many shops

The owner watches from a **laptop** while attendants sell on **phones**, possibly in **different shops**. IndexedDB cannot do that alone.

This is **not** a public multi-tenant SaaS (no billing, no self-serve empire). It is **one business**, many shops, each till offline-first. See `LOCKED_PLAN.md`.

## Current protocol correction — D51 (2026-11-26)

- Protocol v2 uses an explicit table allowlist. Device tokens, businesses and accounts cannot be created or changed through sync. Existing shop/user IDs and every referenced parent must belong to the paired shop/business.
- The local DBCore outbox middleware saves business mutations and their outbox entries in one IndexedDB transaction. Projection-only stock/balance updates never upload stale catalogue rows. Catalogue edits carry changed-field patches.
- Outbox sequence numbers preserve order even when writes share a timestamp. Bounded pushes preserve local transaction groups. A server batch commits atomically and returns acknowledged mutation IDs; HTTP 200 alone never marks rows synced.
- Pulls use complete shop snapshots in a repeatable-read transaction, not timestamp deltas. This deliberately trades bandwidth for correctness while the thin-sync data set is small. Client application is atomic, skips unsent edits, recomputes stock and deni from movements/ledger, and advances its cursor only after commit.
- Serializable push conflicts are retryable. A second distinct void reversal is rejected; replays of the same UUIDs are idempotent. Closed shifts are mutable state, not append-only events.
- A till token remains bound to the shop paired at setup; changing the owner's local selected shop does not change token scope. Other shops' mutations remain pending until that shop is paired on a device.
- Isolated Neon multi-client integration passed in D51, including cleanup assertions. Physical two-device field sign-off has not been repeated.

## Original design (historical where superseded above)

## Principle

1. Build the till **offline-first on one device** (phases 1–5).
2. Add this sync layer (phase 6) for a **second device on the same shop**.
3. Then Phase 7: add shop 2; each device token is bound to one `shop_id`.
4. Do not add billing or public signup.

## Mental model

```
Shop 1 till phone        Shop 2 till phone        Owner laptop
     │                        │                        │
     │  Dexie (that shop)      │  Dexie (that shop)      │  Dexie (all shops, online)
     └──────────┬─────────────┴──────────┬─────────────┘
                │                        │
                └──────────┬─────────────┘
                           ▼
              Postgres: one Business, many Shops
```

A till device **only pulls/pushes its shop**. The owner token may pull all shops in the business.

- **Sales, tenders, stock movements, deni ledger, cash movements:** append-only. Client generates UUIDs. Server inserts if new; never overwrite a completed sale (void is a new status change with rules).
- **Products, customers, users, shop settings:** last-write-wins using `updated_at` (ISO timestamp from client is untrusted for LWW — server sets `server_updated_at` and clients send `updated_at`; on conflict, **server timestamp wins** for catalog; for sales, first write wins).
- **`product.stock_qty` is not a synced field.** Quantity is the sum of stock movements (plus opening receive). Each device applies movements and recomputes qty. If you last-write-wins the qty number, two offline sales will lose a unit.

## Identity

- Business has an owner PIN
- Each shop has `shop_code` (human, e.g. `NATEETE-4K2P`) and `id` (UUID)
- Pairing a till: `shop_code` + owner PIN → **device token scoped to that shop**
- Owner laptop: owner PIN → token scoped to the **business** (all shops)
- Token stored locally; sent as `Authorization: Bearer …`
- Attendant PIN is checked locally after users are synced (and on server when pairing is not needed for every unlock — daily unlock stays local so offline PIN works)

Offline PIN must work. That means `User.pin_hash` is in Dexie.

## Outbox

Every local mutation:

```
OutboxItem { id, table, row_id, op (insert|update|void), payload, created_at, synced_at }
```

When online, flush outbox in created_at order, then pull.

Pull: `GET /api/sync?since=<server_cursor>` returns rows per table + new cursor.

Push: `POST /api/sync` body `{ mutations: OutboxItem[] }`

Idempotent: same UUID insert twice is OK.

## When to sync

- App foreground
- After each completed sale (if online; else outbox)
- `Sync now` button
- Network back online event

Never block the Charge button on a fetch. Write local, attempt sync in background.

## Server stack (keep small)

Same Next.js app:

- Prisma + Postgres (Supabase Postgres or Vercel Postgres — pick what the human has keys for; default **Supabase** if unset, document in `.env.example`)
- Route: `/api/sync` and `/api/pair` (create shop / join shop)
- No Redis, no queues, no GraphQL

If Postgres is not configured, the app **must still sell offline**. Sync buttons show `Cloud not configured`.

## Pairing API (sketch)

`POST /api/pair/create` → { shop, shop_code, token, owner user }

`POST /api/pair/join` { shop_code, pin } → { shop, token, snapshot }

`POST /api/pair/rotate-code` owner only

## Phase 7 extra (many shops)

- `POST /api/shops` owner only: name, optional copy_products_from_shop_id
- List shops for owner
- Device cannot change `shop_id` after pair
- Owner UI shop switcher; attendant has none
- Reports endpoint: today totals grouped by shop_id

## What we are not building

- Row-level sharing between different owners
- Stripe/MoMo subscription billing
- Admin superuser dashboard
- Real-time websocket (pull/push is enough; owner may be 5–30s behind)

## Conflict example (must be correct)

1. Phone offline sells last 2 soaps.
2. Laptop (stale) also sells 1 soap.
3. Both come online.

Result: 3 sale rows exist. Stock movements: −2 and −1. Qty can go negative. That is **correct** per domain (negative stock allowed). Do not drop a sale.

## Tests the builder must add in phase 6

- Two clients: insert two sales with different UUIDs; both persist
- Same sale UUID pushed twice; only one row
- Stock qty on each client equals sum of movements after pull
- Outbox sale completes while `fetch` is failed (offline)

## Cloud branch pairing — Step 05 (2026-11-28)

`POST /api/platform/pair` requires the owner session, existing branch ID, stable device UUID and owner PIN. First connection sets the native business owner PIN; subsequent connections verify it. One serializable transaction preserves business/shop IDs, resumes or issues a branch-bound device and reads a full protocol-v2 snapshot. Foreign tenants and device rebinding fail. It never creates another business or shop. Responses are private/no-store; cross-origin requests are refused when Origin is supplied.

The browser validates branch/parent IDs and integer amounts, then commits books and device credentials together in Dexie without outbox echo. Stock and deni are derived from ledgers. Interrupted activation resumes from committed device records. Other-branch books or unsent work block import: keep them and use an empty browser profile. Legacy create refuses signed-in cloud accounts. Offline PIN selection respects the paired branch; normal sync retains its scoped token. Physical two-device and recovery drills remain Steps 08–09.
