# Working method — planning chat vs builder agent

Two different jobs. Do not mix them in one agent session if we can help it.

## Roles

| Role | Does | Does not |
|---|---|---|
| **Planning chat (this thread)** | Product, domain, approaches, specs, decisions, review of what was built | Write application code unless asked to rescue a stuck build |
| **Builder agent** | Implements exactly what is in this folder | Invent features, change the domain, switch stacks |
| **Human** | Picks approach, answers `DECISIONS.md`, puts the app in a real shop | Assume chat memory is the spec |

## Source of truth

```
SME Management System/*.md   ← product + plan
(future) /src                ← code, only after approach is locked
DECISIONS.md                 ← if chat and docs disagree, docs win after they are updated
```

If we decide something in chat, the planning agent must update the matching `.md` **in the same session**. The builder agent is not expected to read Discord/WhatsApp/chat logs.

## Sequence

```
1. Research + lock (done) → `LOCKED_PLAN.md`
2. Scaffold               → builder Phase 1 (one demo shop)
3. Vertical slice         → offline sell + close (phases 2–5)
4. Thin sync              → laptop + phone, same shop (phase 6)
5. Many shops             → shop 2, owner home (phase 7)
6. Field test             → one real duuka, 7 days, then a second if they have it
7. Patch from reality     → update DOMAIN.md; builder follows
8. Only then              → WhatsApp digest, transfers, EFRIS
```

Do not skip 5. An unused POS is a failed POS.

## Rules for the planning chat

- Prefer updating docs over long chat-only answers
- When the human answers a question, log it in `DECISIONS.md`
- Keep v1 small. New ideas go under “Later” not into the current sprint
- Write for a builder that has **not** seen Uganda: explain deni, float, MoMo, UGX

## Rules for the builder agent

See [AGENTS.md](AGENTS.md). Short version:

- Read all markdown in this folder before touching code
- If a product question is open in `DECISIONS.md`, stop and ask — do not guess
- One vertical slice at a time, in the order of `IMPLEMENTATION_PLAN.md`
- No extra frameworks, no extra apps, no “while I’m here” features

## What “done” means for a phase

A phase is done when:

1. Checklist in `IMPLEMENTATION_PLAN.md` is ticked in a short `PROGRESS.md` (create when build starts)
2. The verification steps for that phase pass
3. Docs that drifted are updated (entity names, screens)
4. Human can tap through the flow on a phone (or the planning chat can)

## Folder layout once code exists (Approach A)

Do not create this until the approach is locked.

```
SME Management System/
  README.md
  AGENTS.md
  ...other docs...
  app/                 ← Next.js app (Approach A)
  public/
  package.json
```

If Approach B or C is locked, the planning chat will replace this layout in `IMPLEMENTATION_PLAN.md` before any scaffold.

## Language

- Docs: English
- UI v1: English with Luganda for the 10–15 critical labels (Sell, Stock, Deni, Close, Cash, etc.) if the human asks. Default English until `DECISIONS.md` says otherwise
- Code: English identifiers (`deni` is allowed; it is domain language)
