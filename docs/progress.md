# Cardano Bounties — Progress Tracker

> **Purpose:** Living document tracking what has been built, what is in progress, and what is next. Update this file every time a feature is completed or a new task begins. AI agents should read this before suggesting what to work on next.

**Last Updated:** 2025-05-12
**Current Phase:** Phase 1 — Core API & Auth

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Completed |
| 🔄 | In Progress |
| ⏳ | Blocked / Waiting |
| 📋 | Planned (next up) |
| 💡 | Backlog (future) |

---

## Phase 1 — Core API & Auth

### Infrastructure
- ✅ Next.js 16 project scaffolded
- ✅ Supabase project created and connected (`lib/supabase.ts`)
- ✅ Vercel deployment configured (`vercel.json` with `--webpack` flag)
- ✅ libsodium postinstall patch (`scripts/fix-libsodium.js`)
- ✅ `next.config.ts` — `serverExternalPackages` for MeshSDK/libsodium
- ✅ Environment variables set in Vercel (Supabase URL, keys, JWT secret)

### Authentication
- ✅ `POST /api/auth/verify` — wallet signature verification + JWT issuance
- 📋 Admin stake key env var configured (`ADMIN_STAKE_KEY`)
- 📋 `isAdmin()` helper in `lib/auth.ts`
- 📋 JWT verification middleware for protected routes

### Bounties API
- ✅ `GET /api/bounties` — list open bounties
- ✅ `POST /api/bounties` — create bounty
- ✅ `GET /api/bounties/[id]` — single bounty detail
- ✅ `PATCH /api/bounties/[id]` — update bounty status (stub)
- ✅ `DELETE /api/bounties/[id]` — cancel bounty (stub)

### Submissions API
- ✅ `POST /api/submissions` — submit work (with duplicate guard)
- ✅ `GET /api/submissions/[id]` — submission detail (stub)
- 📋 `PATCH /api/submissions/[id]` — admin approve/reject

### Admin API
- 📋 `POST /api/admin/release-payment` — trigger ADA payout
- 📋 `POST /api/admin/refund` — trigger ADA refund to poster

---

## Phase 2 — Wallet & Escrow

- 📋 MeshSDK wallet connection (`components/wallet/WalletConnect.tsx`)
- 📋 Escrow transaction builder (`lib/mesh.ts` — `buildEscrowTx`)
- 📋 Payout transaction builder (`lib/mesh.ts` — `buildPayoutTx`)
- 📋 On-chain tx confirmation polling (after escrow deposit)
- 📋 Escrow address configured in environment variables

---

## Phase 3 — Frontend UI

### Public Pages
- 📋 Landing page / Bounty board (`app/(public)/page.tsx`)
- 📋 `BountyBoard.tsx` — filterable grid of open bounties
- 📋 `BountyCard.tsx` — card component (title, reward, type, deadline)
- 📋 Bounty detail page (`app/(public)/bounties/[id]/page.tsx`)
- 📋 `BountyDetail.tsx` — full bounty view + submission CTA

### Authenticated Pages
- 📋 `BountyForm.tsx` — create bounty form + escrow tx flow
- 📋 `SubmissionForm.tsx` — submit work form
- 📋 User dashboard (`app/dashboard/page.tsx`)
  - 📋 My Posted Bounties tab
  - 📋 My Submissions tab

### Admin Pages
- 📋 Admin dashboard (`app/dashboard/admin/page.tsx`)
- 📋 `BountyReviewQueue.tsx` — approve/reject pending bounties
- 📋 `SubmissionReviewQueue.tsx` — approve/reject submissions + trigger payment

---

## Phase 4 — Automation & Notifications

- 💡 Supabase Edge Function — deadline expiry cron job
- 💡 Email notifications on bounty approval/rejection
- 💡 Email notifications on submission approval/rejection
- 💡 On-chain event webhooks (tx confirmation)

---

## Phase 5 — Polish & Launch

- 💡 Empty states and loading skeletons
- 💡 Mobile responsive layout
- 💡 Error boundary components
- 💡 Analytics (Vercel Analytics or Plausible)
- 💡 Public launch / mainnet switch (testnet first)

---

## Known Issues & Tech Debt

| Issue | Status | Notes |
|---|---|---|
| `middleware.ts` deprecation warning | ⏳ | Next.js 16 wants `proxy` convention instead — low priority |
| Stub API routes need full implementation | 🔄 | `PATCH /api/bounties/[id]`, `PATCH /api/submissions/[id]` |
| No JWT verification on protected routes yet | 📋 | Auth middleware needs building out |
| Escrow address not yet configured | 📋 | Needed before Phase 2 begins |

---

## Completed Milestones

- **2025-05-12** — Resolved Vercel build failures (Turbopack/libsodium ESM bug, TypeScript errors in API routes)
- **2025-05-12** — Core CRUD API routes scaffolded for bounties and submissions
- **2025-05-12** — Spec-driven development docs set up (`docs/` folder)

---

## How to Update This File

When you complete a task, change its symbol from `📋` to `✅` and update **Last Updated** at the top.
When you start a task, change it to `🔄`.
When something is blocked, change it to `⏳` and add a note in the Known Issues table.
When a phase is fully complete, add it to **Completed Milestones** with the date.