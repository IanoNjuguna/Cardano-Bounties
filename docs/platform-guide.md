# Cardano Bounties — Platform Flow Guide

> **Purpose:** This file is the canonical reference for how the platform works end-to-end. AI agents and developers should consult this before making decisions about feature implementation, API design, or user flows.

---

## User Roles

| Role | Description |
|---|---|
| **Poster** | Any connected wallet user who creates a bounty and deposits ADA into escrow |
| **Contributor** | Any connected wallet user who submits work toward an open bounty |
| **Admin** | The platform owner — reviews all bounties and submissions, approves work, triggers payment release |

> A single wallet user can be both a Poster and a Contributor on different bounties, but not on the same bounty.

---

## 1. Entry Point — Wallet Connection

Wallet connection is the sole authentication method. No passwords or email accounts.

### Flow
1. User clicks **Connect Wallet**
2. MeshSDK's `CardanoWallet` component loads supported wallets (Eternl, Nami, Lace, Flint, etc.)
3. User approves the connection in their wallet extension
4. App reads the wallet's **stake key** — used as the user's permanent identity
5. Frontend calls `POST /api/auth/verify` → issues a JWT tied to the stake key
6. JWT stored client-side, sent with every API request via `x-user-id` header
7. User profile created in Supabase on first connection (wallet address, stake key, joined date)

> **Why stake key?** The stake key stays constant even when wallet addresses rotate, making it a stable identity anchor across all Cardano transactions.

---

## 2. Posting a Bounty

Any authenticated wallet user can post a bounty. It only goes live after admin approval and on-chain escrow confirmation.

### Flow
1. Poster fills the bounty form: title, description, type, reward (ADA), deadline
2. Frontend calls `POST /api/bounties` — saved in Supabase with status `pending_escrow`
3. Poster is prompted to lock the ADA reward into a MeshSDK-managed escrow address
4. Transaction hash saved to the bounty record; app confirms the tx on-chain
5. Status moves to `awaiting_admin_review`
6. Admin reviews and either:
   - **Approves** → status `open`, visible on public board
   - **Rejects** → status `rejected`, poster notified, escrow refund triggered

### Escrow Transaction (MeshSDK)
```ts
const tx = new Transaction({ initiator: wallet });
tx.sendLovelace(escrowAddress, rewardInLovelace);
const txHash = await wallet.signTx(await tx.build());
await wallet.submitTx(txHash);
// Save txHash to bounty record in Supabase
```

---

## 3. The Bounty Board

Public board showing all admin-approved open bounties.

### Filters
- Type (bug fix, feature, content, design, other)
- Reward range (min/max ADA)
- Deadline (soonest first)
- Date posted

### Bounty Detail Page
Shows full description, reward amount, poster's anonymised address, deadline, and current submission count. Unauthenticated visitors see a Connect Wallet prompt before they can submit.

---

## 4. Contributing — Submitting Work

Any authenticated wallet user (except the bounty's own poster) can submit. **One submission per wallet per bounty.**

### Flow
1. Contributor opens an open bounty's detail page
2. Clicks **Submit Work** → fills submission form: description, links (GitHub PR, demo, video), notes
3. Frontend calls `POST /api/submissions` with `bounty_id`, `contributor_id` (from JWT), `content`
4. Saved in Supabase with status `pending`
5. Duplicate check (unique constraint on `bounty_id + contributor_id`) blocks re-submissions
6. Contributor sees confirmation; submission appears in their **My Submissions** dashboard

> **One submission rule:** If a submission is rejected, the contributor cannot re-submit. This keeps the admin review queue clean.

---

## 5. Admin Review & Approval

The admin is the sole decision-maker on both bounty listings and submission approvals.

### Bounty Review (Admin Dashboard)
- Sees all bounties with status `awaiting_admin_review`
- Reviews title, description, type, reward amount, and escrow `txHash`
- **Approve** → status `open`
- **Reject** → status `rejected`, escrow refund triggered

### Submission Review (Admin Dashboard)
- Sees all `pending` submissions grouped by bounty
- Reviews content, links, and supporting material
- **Approve one winner** → triggers payment release
- **Reject** → contributor notified, bounty remains open

> **Admin access control:** Every admin API route checks that the JWT belongs to the hardcoded admin wallet address before processing.

---

## 6. Payment Release

Triggered by admin after approving a submission. ADA moves from escrow directly to the contributor's wallet.

### Flow
1. Admin clicks **Approve & Release Payment** on the winning submission
2. Frontend (admin) builds a MeshSDK transaction releasing escrowed ADA to contributor's wallet address
3. Admin signs and submits the transaction from the platform escrow wallet
4. Transaction hash recorded in Supabase
5. Supabase updated atomically:
   - Bounty → `completed`
   - Winning submission → `approved`
   - All other submissions on that bounty → `closed`
6. Poster and contributor notified

```ts
const tx = new Transaction({ initiator: wallet });
tx.sendLovelace(contributorWalletAddress, rewardInLovelace);
const txHash = await wallet.signTx(await tx.build());
await wallet.submitTx(txHash);
```

---

## 7. Cancellations & Refunds

### Admin-Initiated Cancellation
- Bounty → `cancelled`
- All pending submissions → `closed`
- Escrowed ADA refunded to poster via MeshSDK

### Deadline Expiry
- Supabase cron/Edge Function detects expired open bounties
- Bounty → `expired`
- Admin notified to extend deadline or trigger refund
- Escrowed ADA returned to poster

---

## 8. Status Reference

### Bounty Statuses
```
pending_escrow → awaiting_admin_review → open → completed
                                               ↘ cancelled
                                               ↘ expired
                              ↘ rejected
```

### Submission Statuses
```
pending → approved   (one winner per bounty)
        → rejected
        → closed     (when bounty completes, cancels, or expires)
```

---

## 9. API Route Summary

| Method | Route | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/verify` | Public | Verify wallet signature, issue JWT |
| `GET` | `/api/bounties` | Public | List all open bounties |
| `POST` | `/api/bounties` | Auth | Create a new bounty |
| `GET` | `/api/bounties/[id]` | Public | Get single bounty details |
| `PATCH` | `/api/bounties/[id]` | Admin | Update bounty status |
| `DELETE` | `/api/bounties/[id]` | Admin | Cancel a bounty |
| `POST` | `/api/submissions` | Auth | Submit work to a bounty |
| `GET` | `/api/submissions/[id]` | Auth | Get submission details |
| `PATCH` | `/api/submissions/[id]` | Admin | Approve or reject submission |
| `POST` | `/api/admin/release-payment` | Admin | Release ADA to contributor |
| `POST` | `/api/admin/refund` | Admin | Refund ADA to poster |

---

## 10. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Blockchain / Wallet | MeshSDK (`@meshsdk/core`, `@meshsdk/react`) on Cardano |
| Auth | Wallet signature verification + JWT (`jsonwebtoken`) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| File Storage | Supabase Storage (submission attachments) |
| Hosting | Vercel (Next.js serverless functions) |
| Automation | Supabase Edge Functions (deadline checks, notifications) |

---

*This is the v1 admin-managed flow. Decentralised peer-to-peer review may be introduced in a future version.*