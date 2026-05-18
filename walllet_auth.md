# Cardano Wallet Authentication Implementation Prompt

## Context
I am building **Cardano Bounties**, a Next.js web application where users authenticate using their Cardano wallet (stake key) instead of a traditional username/password. The backend uses Supabase as the database and Resend for emails. Authentication tokens are issued as JWTs.

---

## Tech Stack
- **Framework**: Next.js (App Router) with TypeScript
- **Database**: Supabase
- **Email**: Resend
- **Wallet SDK**: `@meshsdk/core` and `@meshsdk/react`
- **Auth**: JWT via `jsonwebtoken`

---

## What Already Exists

> ✅ Dependencies (`@meshsdk/core`, `@meshsdk/react`, `jsonwebtoken`) are already installed.
> ✅ Supabase `users` table is already created with the correct schema.

### Backend API Route 1 — `GET /api/auth/nonce`
Generates a nonce and stores it against the user's stake address in Supabase:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const address = req.nextUrl.searchParams.get('address')
    if (!address) {
        return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }
    const { generateNonce } = await import('@meshsdk/core')
    const nonce = generateNonce('Sign in to Cardano Bounties: ')
    const nonce_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stake_address', address)
        .single()

    if (existingUser) {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ nonce, nonce_expires_at })
            .eq('stake_address', address)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
        const { error } = await supabaseAdmin
            .from('users')
            .insert({ stake_address: address, nonce, nonce_expires_at })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ nonce })
}
```

### Backend API Route 2 — `POST /api/auth/verify`
Verifies the signed nonce and issues a JWT:

```typescript
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { address, signature } = body;

  if (!address || !signature) {
    return NextResponse.json({ error: "address and signature are required" }, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, nonce, nonce_expires_at, role")
    .eq("stake_address", address)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  if (new Date(user.nonce_expires_at) < new Date()) {
    return NextResponse.json({ error: "Nonce expired, please try again" }, { status: 401 });
  }

  const { checkSignature } = await import('@meshsdk/core')
  const isValid = checkSignature(user.nonce, signature, address)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  await supabaseAdmin
    .from("users")
    .update({ nonce: null, nonce_expires_at: null })
    .eq("stake_address", address);

  const token = jwt.sign(
    { userId: user.id, address, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return NextResponse.json({ token });
}
```

---

## What Needs To Be Implemented

Please implement all of the following:

---

### 1. MeshProvider Wrapper
Wrap the root layout with `MeshProvider` from `@meshsdk/react`:

```tsx
// app/layout.tsx
import { MeshProvider } from '@meshsdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MeshProvider>
          {children}
        </MeshProvider>
      </body>
    </html>
  );
}
```

---

### 2. WalletAuth Component
Create `components/WalletAuth.tsx`. This component:
- Uses `CardanoWallet` from `@meshsdk/react` as the connect button
- On connect, calls `wallet.getRewardAddresses()` to get the **stake address** (NOT `getUsedAddresses()`)
- Calls `GET /api/auth/nonce?address=<stakeAddress>` to get a nonce
- Calls `wallet.signData(nonce, stakeAddress)` to prompt the user to sign
- Calls `POST /api/auth/verify` with `{ address, signature }`
- Stores the returned JWT in `localStorage` under the key `cb_token`

```tsx
'use client'
import { CardanoWallet, useWallet } from '@meshsdk/react';
import { useState } from 'react';

export default function WalletAuth() {
  const { wallet, connected } = useWallet();
  const [loading, setLoading] = useState(false);

  async function startLoginProcess() {
    if (!connected) return;
    setLoading(true);
    try {
      const stakeAddresses = await wallet.getRewardAddresses();
      const stakeAddress = stakeAddresses[0];

      const nonceRes = await fetch(`/api/auth/nonce?address=${stakeAddress}`);
      const { nonce } = await nonceRes.json();

      const signature = await wallet.signData(nonce, stakeAddress);

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: stakeAddress, signature }),
      });

      const { token } = await verifyRes.json();
      localStorage.setItem('cb_token', token);
    } catch (err) {
      console.error('Auth failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CardanoWallet
      label={loading ? 'Signing in...' : 'Sign In with Cardano'}
      onConnected={() => startLoginProcess()}
    />
  );
}
```

---

### 3. Auth Fetch Helper
Create `lib/api.ts` — a wrapper around `fetch` that automatically attaches the JWT from `localStorage`:

```typescript
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cb_token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
```

---

### 4. JWT Middleware
Create `middleware.ts` at the root of the project to protect all API routes under `/api/bounties` and `/api/submissions`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/bounties/:path*', '/api/submissions/:path*'],
};
```

---

### 5. Environment Variables
Ensure the following are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # NOT the anon key
JWT_SECRET=a_long_random_secret_string
```

---

## Authentication Flow (for reference)

```
User clicks "Sign In with Cardano"
        ↓
Wallet connects → get stake address via getRewardAddresses()
        ↓
Frontend → GET /api/auth/nonce?address=stake1...
        ↓
Backend generates nonce → saves to Supabase users table (upsert)
        ↓
Frontend → wallet.signData(nonce, stakeAddress)  ← user approves in wallet popup
        ↓
Frontend → POST /api/auth/verify { address, signature }
        ↓
Backend: checks nonce not expired → checkSignature() → clears nonce → issues JWT
        ↓
Frontend stores JWT in localStorage → attaches to all future API calls via authFetch()
```

---

## Important Notes
- Always use `getRewardAddresses()` (stake key / reward address) — NOT `getUsedAddresses()` (base address). The backend stores `stake_address` so these must match.
- The nonce expires in 5 minutes. If the user takes too long to sign, they must restart the flow.
- The nonce is cleared after use to prevent replay attacks.
- The JWT is valid for 7 days and contains `{ userId, address, role }`.
- Use the `authFetch()` helper for any API calls that require authentication.