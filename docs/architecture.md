# Cardano Bounties — Architecture

> **Purpose:** Technical reference for project structure, data models, environment config, and key architectural decisions. Consult this before adding new files, tables, or API routes.

---

## Folder Structure

```
cardano-bounties/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── verify/
│   │   │       └── route.ts          # Wallet signature verification + JWT issuance
│   │   ├── bounties/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET (detail), PATCH (update), DELETE (cancel)
│   │   ├── submissions/
│   │   │   ├── route.ts              # POST (submit work)
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, PATCH (approve/reject)
│   │   └── admin/
│   │       ├── release-payment/
│   │       │   └── route.ts          # Trigger ADA release to contributor
│   │       └── refund/
│   │           └── route.ts          # Trigger ADA refund to poster
│   ├── (public)/
│   │   ├── page.tsx                  # Landing / bounty board
│   │   └── bounties/
│   │       └── [id]/
│   │           └── page.tsx          # Bounty detail page
│   ├── dashboard/
│   │   ├── page.tsx                  # User dashboard (my bounties, my submissions)
│   │   └── admin/
│   │       └── page.tsx              # Admin review dashboard
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── wallet/
│   │   └── WalletConnect.tsx         # MeshSDK wallet connection button
│   ├── bounties/
│   │   ├── BountyCard.tsx
│   │   ├── BountyBoard.tsx
│   │   ├── BountyForm.tsx
│   │   └── BountyDetail.tsx
│   ├── submissions/
│   │   ├── SubmissionForm.tsx
│   │   └── SubmissionCard.tsx
│   └── admin/
│       ├── BountyReviewQueue.tsx
│       └── SubmissionReviewQueue.tsx
├── lib/
│   ├── supabase.ts                   # Supabase client + admin client
│   ├── auth.ts                       # JWT helpers
│   └── mesh.ts                       # MeshSDK escrow helpers
├── middleware.ts                      # Route protection (deprecated → proxy in Next 16)
├── docs/
│   ├── OVERVIEW.md
│   ├── PLATFORM_GUIDE.md
│   ├── ARCHITECTURE.md               # This file
│   └── PROGRESS.md
├── scripts/
│   └── fix-libsodium.js              # Postinstall patch for libsodium ESM bug
├── next.config.ts
├── vercel.json
└── package.json
```

---

## Database Schema (Supabase / PostgreSQL)

### `users`
```sql
create table users (
  id           uuid primary key default gen_random_uuid(),
  wallet_addr  text not null unique,
  stake_key    text not null unique,      -- permanent identity
  created_at   timestamptz default now()
);
```

### `bounties`
```sql
create table bounties (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  type            text not null,          -- 'bug_fix' | 'feature' | 'content' | 'design' | 'other'
  reward_amount   numeric not null,       -- in ADA
  platform_fee_amount numeric not null default 0,
  total_funding_amount numeric not null default 0,
  deadline        timestamptz,
  status          text not null default 'pending_escrow',
  -- status flow:
  -- pending_escrow → awaiting_admin_review → open → completed
  --                                               → cancelled
  --                                               → expired
  --                        → rejected
  escrow_address  text,
  escrow_tx_hash  text,                   -- submitted on-chain tx hash
  escrow_submitted_at timestamptz,
  escrow_confirmed_at timestamptz,
  payout_tx_hash  text,                   -- set when payment is released
  refund_tx_hash  text,
  refunded_at     timestamptz,
  created_by      text not null,          -- wallet_addr of poster
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### `submissions`
```sql
create table submissions (
  id              uuid primary key default gen_random_uuid(),
  bounty_id       uuid not null references bounties(id),
  contributor_id  text not null,          -- wallet_addr of contributor
  content         text not null,          -- description + links
  status          text not null default 'pending',
  -- status: pending → approved | rejected | closed
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (bounty_id, contributor_id)      -- one submission per wallet per bounty
);
```

---

## Authentication Flow

```
Wallet signs a challenge message
        ↓
POST /api/auth/verify
        ↓
Server verifies signature + extracts stake key
        ↓
JWT issued: { sub: stakeKey, walletAddr, role: 'user' | 'admin' }
        ↓
JWT sent in header: x-user-id on all subsequent requests
        ↓
API routes extract and verify JWT via lib/auth.ts
```

### Admin Detection
```ts
// lib/auth.ts
const ADMIN_STAKE_KEY = process.env.ADMIN_STAKE_KEY;

export function isAdmin(stakeKey: string): boolean {
  return stakeKey === ADMIN_STAKE_KEY;
}
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Used only in server-side lib/supabase.ts (supabaseAdmin)

# Auth
JWT_SECRET=                        # Secret for signing JWTs

# Admin
ADMIN_STAKE_KEY=                   # Stake key of the admin wallet

# Escrow
ESCROW_ADDRESS=                    # Cardano address where bounty ADA is held
NEXT_PUBLIC_ESCROW_ADDRESS=        # Same preprod escrow address exposed to the browser wallet flow
BLOCKFROST_PREPROD_PROJECT_ID=     # Server-only Blockfrost preprod project id
BLOCKFROST_MIN_CONFIRMATIONS=1     # Optional; defaults to 1
```

---

## Key Technical Decisions

### Why `--webpack` for production builds?
MeshSDK depends on `libsodium-wrappers-sumo`, whose ESM build references `libsodium-sumo.mjs` — a file missing from the npm package on Vercel's environment. Webpack (not Turbopack) correctly resolves the CJS build. See `vercel.json` and `scripts/fix-libsodium.js`.

### Why Supabase Admin client server-side only?
`supabaseAdmin` uses the `service_role` key which bypasses Row Level Security. It must never be exposed to the client. All admin DB operations happen in API routes only.

### Why stake key as identity (not wallet address)?
Cardano wallets can have many addresses but one stake key. Using the stake key as `user_id` means a user's identity is consistent even when their receiving address changes.

### Why admin-managed in v1?
Simplifies dispute resolution and quality control. Poster-managed review (the traditional model) introduces edge cases around abandonment, bias, and bad-faith rejection that require smart contract arbitration. This is planned for v2.

---

## Supabase Client Setup

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Public client — respects RLS, safe for server components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client — bypasses RLS, server/API routes only
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## MeshSDK Usage Pattern

```ts
// lib/mesh.ts
import { Transaction } from '@meshsdk/core';

export async function buildEscrowTx(wallet: any, lovelace: string, escrowAddr: string) {
  const tx = new Transaction({ initiator: wallet });
  tx.sendLovelace(escrowAddr, lovelace);
  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  return wallet.submitTx(signedTx);  // returns txHash
}

export async function buildPayoutTx(wallet: any, lovelace: string, recipientAddr: string) {
  const tx = new Transaction({ initiator: wallet });
  tx.sendLovelace(recipientAddr, lovelace);
  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  return wallet.submitTx(signedTx);  // returns txHash
}
```

---

## Build & Deployment Config

### `vercel.json`
```json
{
  "buildCommand": "npm run build -- --webpack"
}
```

### `next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "libsodium-wrappers-sumo",
    "@cardano-sdk/crypto",
    "@meshsdk/core-cst",
    "@meshsdk/core",
  ],
};

export default nextConfig;
```

### `scripts/fix-libsodium.js`
Postinstall script that patches `libsodium-wrappers-sumo/package.json` to remove the broken ESM export condition, forcing Node.js to use the CJS build at runtime.
