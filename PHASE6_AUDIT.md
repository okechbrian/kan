# Phase 6 audit — 2026-09-06

Against `IMPLEMENTATION_PLAN.md` Phase 6 and `SYNC.md`.

## Plan checklist

| Required | Before audit | After audit |
|---|---|---|
| Prisma schema + shop_id | Schema yes; **not in package.json** | Listed + `.env.example` |
| `/api/pair/create` + join | Yes, 503 if no cloud | 503 only → local create; show shop code |
| `/api/sync` push/pull + outbox | Routes existed; **wrong Prisma names** (`products` vs `product`) | Mapped delegates; batch push |
| Stock qty from movements, never LWW | Pull `put()` whole product incl. qty | Strip `stock_qty`; recompute |
| Setup create/join | Home **always seeded demo**, skipped `/setup` | Empty shop → `/setup` |
| Online pill + Sync now + Pair | Pill + alert for code | Cloud not configured / Offline / Syncing / Synced; Sync now |
| Sell without DATABASE_URL | Dexie yes | Still; outbox if no token |
| Tests: two UUIDs, idempotent, qty=sum, offline sale | Local Dexie only; duplicate UUID not tested as sync apply | `sync-core` apply tests |

## Bugs vs the spec (fixed)

1. **Prisma client never used correctly.** Delegates are `prisma.sale` not `prisma.sales`. Pull/push would no-op.
2. **`GET ?since=` ignored.** Full dump every time; fake cursor.
3. **`stock_qty` last-write-wins** on pull — two offline sales lose a unit.
4. **Sales did not write the outbox.** Charge never queued a mutation.
5. **Home auto-seeded Demo Duuka** so `/setup` was unreachable.
6. **Create shop jumped to PIN** before showing the shop code.
7. **Join snapshot** omitted movements/sales so the second device could not recompute stock.
8. **No `.env.example`.** `prisma` / `@prisma/client` missing from `package.json`.
