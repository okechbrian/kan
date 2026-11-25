# Kan — launch checklist

Status: pre-launch. R1–R11 code is shipped and deployed to a temporary Vercel URL. The items below are the remaining real-world gates.

## Done

- [x] Docs re-locked for Kan (D40–D47), full scope in `KAN_SCOPE.md`
- [x] Git repo created and pushed (`okechbrian/kan`)
- [x] Public site + honest dashboard shell (R1)
- [x] Platform foundation: tenancy/auth/RBAC/quotas/audit (R2)
- [x] Commerce depth, batches, transfers, receipts (R3)
- [x] Manual payments and reconciliation (R4)
- [x] Path-based storefront preview (R5)
- [x] Channels previews (R6)
- [x] Local analytics and alerts (R7)
- [x] PWA shell, offline fallback, optional hardware helpers (R8)
- [x] All 16 vertical profiles, wave 1 enabled, waves 2–3 previewed (R9)
- [x] Guardrailed AI surface + partner-only banking surfaces, no fake data (R10)
- [x] Support centre and launch checklist (R11)
- [x] Gates: eslint 0, tsc 0, 145+ tests, next build, render gate at 360/375/412px

## Blocking for a real launch

| Item | Why | Owner |
|---|---|---|
| Final UGX plan prices | `/pricing` is marked indicative | Owner |
| Legal entity name | All legal pages have an explicit placeholder | Owner |
| Tagline approval | Default "Kan — your shop, in one place." | Owner |
| Supabase `DATABASE_URL` | Turns on accounts, sync and real orders | Owner |
| SMTP provider | Receipts, invoices, alerts, account mail | Owner |
| Payment gateway credentials | Live card/bank/MoMo collection | Owner |
| Gemini/OpenAI key | Makes the AI assistant answer from real data | Owner |
| App-store accounts + signing cert | Android/iOS/Windows releases | Owner |
| Test hardware | Barcode/printer/drawer sign-off | Owner |
| Licensed banking/crypto partner | R10 partner features | Owner |

## Non-negotiables at launch

- UGX integers only; money never floats.
- A sale completes offline. A failed fetch never blocks charging.
- Attendants use PIN, never email.
- No invented revenue, customers, testimonials or balances.
- Offline till keeps working if the cloud is down or unconfigured.
- `.env` is never committed.
- Every business row carries `business_id` and `shop_id`.

## Verification commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run start        # then in another shell:
npm run check:render -- http://localhost:3000
```

## Deployment

Vercel project `kan-sme` (Hobby). Temporary URL: https://kan-sme.vercel.app. Attach a custom domain when the owner has one; no code change is needed because URLs come from `NEXT_PUBLIC_SITE_URL`.
