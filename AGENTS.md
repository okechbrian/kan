# AGENTS.md — rules for the coding agent

**Active execution rule (D54, 2026-11-26):** Follow the sequential plan in `IMPLEMENTATION_PLAN.md`. Step 01 is an accepted documented baseline; authenticated reference details remain deferred and unverified. Step 02 deployment verification is active. Full Konna parity, one step at a time, and all Uganda/offline safeguards remain required.
You are implementing **Kan**, an Uganda-first commerce platform built on the existing offline till. The former product name was Duuka; the till engine and its rules are preserved.

Read these files before any code:

1. `README.md`
2. `HANDOFF.md`
3. `KAN_SCOPE.md` — the entire scope
4. `LOCKED_PLAN.md` — what is locked right now
5. `DECISIONS.md` — D40–D47 supersede the older Duuka-only decisions
6. `DOMAIN.md` — duka rules (still authoritative for the till)
7. `UI_MAP.md` — Part A (Kan web), Part B (till)
8. `IMPLEMENTATION_PLAN.md` — Kan program R0–R11
9. `SYNC.md` (from the old Phase 6)
10. This file

Work on **one release at a time**. Current authorized work is **D51 audit remediation of existing code**, including the till and sync; do not add a new feature release. Konna is a structural reference only: never copy its copy, branding, testimonials, numbers or legal text. Banking, crypto and AI are partner-or-defer — never simulated.

## Mission

D52: Full Konna tool coverage is the product target. A smaller grocery MVP is an interim milestone only; do not silently remove tools from the agreed scope.

Build only the locked approach’s current phase. The user will field-test this in a real shop. Correctness of money and stock beats beautiful UI.

## Hard rules

1. **Docs win.** If you want a feature that is not in the docs, do not add it. Write a question instead.
2. **No stack improvisation.** Use the stack in `IMPLEMENTATION_PLAN.md` for the locked approach.
3. **UGX is an integer.** Never `number` floats for money. Format with thousands separators for display.
4. **Offline sales must work** (Approach A). A failed fetch must not block completing a sale.
5. **Do not require email** for attendants. PIN only.
6. **Do not require barcode, printer, or GPS.**
7. **Do not add URA/EFRIS or WhatsApp POS.** AI, billing, online store and native apps are in `KAN_SCOPE.md` but may only be built at their locked release (R2+ / R5+ / R8+ / R10). Multi-shop UI stays after the till and sync work. Seed one demo shop but put `business_id` + `shop_id` on rows from day one.
8. **Negative stock is allowed** with a warning. Never block a sale because stock is 0.
9. **Credit sale requires a customer.** Cash sale must not.
10. **Void is owner-only** and must reverse stock and deni. No silent deletes.
11. **`.env` secrets never committed.** `.env.example` is fine.
12. **No `console.log` in production paths.**

## Money helper

Implement a tiny module and use it everywhere:

- `ugx(n: integer) -> string` e.g. `UGX 50,000`
- All persistable amounts: integer
- Tenders on a sale must sum to `sale.total`

## UI rules

- Mobile first. Design at 360px width first
- Minimum tap target ~44px, prefer larger for product tiles
- High contrast, readable outdoors
- Fast-mover grid on the sell screen — not a tiny HTML table
- English UI unless `DECISIONS.md` says to add Luganda labels
- Empty states must tell the keeper what to do (“Add sugar, oil, soap before you can sell”)

## Data rules (Approach A)

- IndexedDB via Dexie (or the library named in the plan)
- Every business row includes `shop_id`
- Backup export/import JSON is part of v1, not optional
- Warn in UI: clearing browser data deletes the shop books until backup/sync exists

## Verification before you say a phase is done

Run whatever exists of:

- `npm run lint`
- `npm run typecheck` / `tsc --noEmit`
- `npm test` for money math, stock deltas, deni balance, close/expected-cash
- `npm run build`

Add tests for money and stock **before** adding more screens.

Minimum tests for the first vertical slice:

- Sale of 2 items, cash, stock decreases
- Credit sale increases customer balance
- Collection decreases balance
- Void reverses stock and deni
- Close: expected cash matches a known fixture (float + cash sales − draws)

## Git

Standing owner instruction (2026-11-26): after completing and verifying authorized changes, commit and push to `main` so Vercel can deploy. Do not force-push. Exclude unrelated files and secrets.

- Do not commit `node_modules`
- Conventional commits, one phase per commit when possible
- Do not `git push --force` unless the human asks

## When you are stuck

Stop and ask, with options, if:

- Approach is not locked
- A `DECISIONS.md` item is still open and blocks the current phase
- Two docs contradict each other

Do not guess Uganda-specific product behaviour (deni, MoMo, float). It is already in `DOMAIN.md`.
