# Kan — commerce platform for Ugandan shops

Working brand: **Kan**. Folder name stays `SME Management System`.

This folder is the **source of truth** for product, architecture and implementation. A builder agent works from these files, not from chat memory.

**Status:** Phase 0 (Housekeeping & CI), Phase 1 (Kan Brand System & UI Kit), and **Phase 2 (Full 14-Page Konna-Parity Public Website)** complete per **[KONNA_PARITY_PLAN.md](KONNA_PARITY_PLAN.md)**. Next: **Phase 3 (Supabase Cloud & Auth)**. See [HANDOFF.md](HANDOFF.md) and [DECISIONS.md](DECISIONS.md) D48–D50.

**Live (temporary Vercel URL):** https://kan-sme.vercel.app · Repo: https://github.com/okechbrian/kan

---

## What this is

Kan is an Uganda-first, multi-tenant commerce platform built on the existing offline till:

- Sell at the counter with **no internet** (the proven Duuka core)
- Keep stock, credit (deni) and the till close correct
- Later: online store, payments, analytics, native apps, merchant discovery
- One owner, many shops; each till device bound to one shop

It is **not yet** a full ERP, bank, tax system or AI product. Those are scoped in `KAN_SCOPE.md` and gated by `DECISIONS.md`.

---

## Doc map

| File | Purpose | Who reads it |
|---|---|---|
| [HANDOFF.md](HANDOFF.md) | Start here after a session break | Everyone |
| [KAN_SCOPE.md](KAN_SCOPE.md) | **The entire product scope**, teardown, roadmap, tool audit | Everyone |
| [AGENTS.md](AGENTS.md) | Rules for the coding agent | Builder agent |
| [WORKING_METHOD.md](WORKING_METHOD.md) | Planning chat vs builder split | Humans + agents |
| [PRODUCT_VISION.md](PRODUCT_VISION.md) | Problem, users, success, non-goals | Everyone |
| [DOMAIN.md](DOMAIN.md) | Duka workflows, glossary, entities (still the till's rulebook) | Builder agent |
| [RESEARCH.md](RESEARCH.md) | Uganda shop / POS / connectivity evidence | Humans |
| [LOCKED_PLAN.md](LOCKED_PLAN.md) | What is locked **right now** | Everyone |
| [APPROACHES.md](APPROACHES.md) | Original A/B/C (historical) | Humans |
| [UI_MAP.md](UI_MAP.md) | Screens and copy (Kan web + preserved till) | Builder agent |
| [SYNC.md](SYNC.md) | Thin sync + many shops | Builder agent |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Release roadmap R0–R11 | Builder agent |
| [DECISIONS.md](DECISIONS.md) | Locked decisions and open questions | Everyone |

A decision made in chat must be written into `DECISIONS.md` the same day. Chat is not the source of truth.

---

## Locked direction

- Brand **Kan**; Uganda first; **UGX integers only**.
- No owned domain: deploy on Vercel Hobby `*.vercel.app` via `NEXT_PUBLIC_SITE_URL` until a domain is bought.
- First shippable release: public site + dashboard shell. No fabricated data anywhere.
- Banking, crypto and AI: partner or defer — never fake.
- The offline till stays working; cloud features must never block a sale.

Build order: R0 re-lock → R1 site/shell → R2 platform → R3 commerce → R4 payments → R5 store → R6 channels → R7 analytics → R8 clients → R9 verticals → R10 AI/partners → R11 launch ops.

---

## What a builder agent must not do

- Invent features outside `KAN_SCOPE.md`
- Show fake revenue, fake testimonials or fake customer counts
- Assume Western retail (barcode required, card mandatory, email login for attendants)
- Treat the internet as always available
- Store money as floating point
- Re-enable the old Duuka-only scope without a new decision

---

## Run locally

```bash
cd "C:\Users\y\OneDrive\Desktop\New folder\SME Management System"
npm install
npm run lint
npm run typecheck
npm run test
npm run dev
```

TLS/proxy note: `npm install` has failed with `ERR_SSL_CIPHER_OPERATION_FAILED` on forced-proxy networks. Use a normal network if that happens.

## Next step

Point the builder at `HANDOFF.md` and **R1 only**. Do not start R2 platform work until R1 is signed off.
