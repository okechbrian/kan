# HANDOFF — read this first

**Date:** 2026-11-24
**Project:** Kan (folder: `SME Management System`)
**Path:** `C:\Users\y\OneDrive\Desktop\New folder\SME Management System`

Chat memory is not the source of truth. The `.md` files in this folder are.

---

## Where we are

| Item | Status |
|---|---|
| Product | Re-scoped to **Kan** platform (D40–D47); full scope in `KAN_SCOPE.md` |
| Offline till (former Duuka Phases 1–5) | Done and signed off — 49 passing tests; engine preserved |
| Thin sync (Phase 6) | Scaffolding exists (`sync-core.ts`, `/api/pair`, `/api/sync`, outbox), **not signed off** |
| Current release | **R0/R1** — docs re-lock + public site + honest dashboard shell |
| Git | Folder is **not a repo yet** — `git init` + push is part of R0 |
| Brand / domain | Kan; no owned domain — Vercel Hobby `*.vercel.app` via `NEXT_PUBLIC_SITE_URL` |
| Toolchain | Node 22, npm 10, git 2.54, Python 3.13, Docker, adb, Vercel/EAS/Supabase/Flutter/gh CLIs — all verified present |
| Git remote | `https://github.com/okechbrian/kan` — commit `fc54247` pushed to `main` |
| Live site | https://kan-sme.vercel.app (Vercel project `kan-sme`, Deployment Protection off, all public routes 200) |
| R2 platform | Shipped: Prisma `Account`/`Session`/`Subscription`/`AuditEvent`/`Notification`, auth+onboarding APIs, RBAC, plan quotas, audit redaction. Honest 503 `database_not_configured` while `DATABASE_URL` is unset. 76 tests. |

---

## If you are the builder agent

1. Read, in order: this file → `AGENTS.md` → `KAN_SCOPE.md` → `LOCKED_PLAN.md` → `DECISIONS.md` → `UI_MAP.md` Part A.
2. Implement **R0/R1 only**:
   - Re-lock docs (done in this handoff's commit), init git, add CI + ESLint config.
   - Public site routes; dashboard shell routes; move old `/` redirect to `/pos`.
   - Keep `/pin`, `/sell`, `/stock`, `/customers`, `/more` untouched.
   - Every unbuilt panel tagged `Coming soon` or `With partner`. **No fake data.**
3. Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, built-site render at 360/375/412.
4. Stop and report what to click. Do not start R2 platform work.

---

## If you are the planning agent

- Product decisions: `DECISIONS.md` D40–D47. Full scope: `KAN_SCOPE.md`.
- Uganda evidence: `RESEARCH.md`. Duka rules: `DOMAIN.md`.
- Original Duuka phases 1–5 remain valid for the **till engine**; see `IMPLEMENTATION_PLAN.md` historical section.

---

## Locked product in one paragraph

Kan is an Uganda-first commerce platform built on a phone till that sells with no internet. One owner, many shops, each till bound to one shop; stock and deni stay per shop. The first release is a public marketing site and an honest dashboard shell. The offline till is reused for R3. Banking, crypto and AI are partner-or-defer, never simulated. Build order: R0 re-lock → R1 site/shell → R2 platform → … → R11 launch ops.

---

## Still needed from the owner (not blocking R1 code)

Final UGX plan prices, legal entity name, tagline (default "Kan — your shop, in one place.").

## Run

```bash
cd "C:\Users\y\OneDrive\Desktop\New folder\SME Management System"
npm install
npm run lint && npm run typecheck && npm run test && npm run build
npm run dev
```
