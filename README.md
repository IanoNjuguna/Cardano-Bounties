# Cardano Bounties

**An open, on-chain bounty platform connecting Cardano projects with contributors — built in public, funded in ADA.**

Cardano Bounties is a decentralized-first task marketplace for the Cardano ecosystem. Projects and teams post scoped work items (bounties) with ADA rewards; developers, designers, writers, and community contributors can explore, claim, and submit work — all verified through Cardano wallet authentication, with no platform account required.

---

## ✨ Overview

The Cardano ecosystem is growing fast, but it lacks a structured, accessible way for community members to contribute and get paid for their work. Cardano Bounties bridges that gap by providing:

- **For Projects:** A lightweight dashboard to post bounties, track applicants, and manage ADA reward payouts.
- **For Contributors:** A public board of open tasks across development, design, content, and community categories — browsable and submittable with just a Cardano wallet.
- **For the Ecosystem:** Transparent, on-chain accountability for contribution work, building a verifiable contributor reputation over time.

---

## 🚀 Features

### 🌐 Public Landing Page
- Animated hero section with a live preview of open bounties.
- Metrics summary (total ADA rewarded, open bounties, active contributors).
- "How It Works" section explaining the 3-step contribution flow.
- Benefits section highlighting the platform's value proposition.
- Frequently Asked Questions accordion.
- Waitlist form for early access sign-up via email.
- Footer with platform links and community channels.

### 🔍 Explore Bounties
- Real-time bounty grid with search and category filters.
- Paginated results with skeleton loading states.
- Per-bounty summary cards showing project identity, reward, deadline, and type.
- Fully responsive across mobile, tablet, and desktop.

### 📋 Bounty Details Page
- Tabbed interface: **Brief**, **Instructions**, **Contributions**, **Submit Work**, **Details**.
- Sidebar summary card showing reward amount, deadline, and status.
- Contribution submission form (link + reviewer notes), gated behind wallet authentication.
- Live contributor table showing all submissions and their review status.
- Smooth "Submit Work" anchor scroll from the hero panel.

### 🔐 Wallet Authentication
- Native Cardano wallet connection via **MeshSDK** (no username/password required).
- Challenge-response authentication: the backend issues a nonce, the user signs it with their wallet, and the server verifies the signature.
- JWT-based session token stored in `sessionStorage` for stateless auth on all protected API calls.
- Supports all major Cardano wallets (Eternl, Nami, Vespr, Flint, etc.).

### 📊 Poster Dashboard
- Overview page with key metrics: total bounties posted, open/closed counts, total reward spend.
- Bounty management table with status filtering and quick-action controls.
- Bounty creation form with project name, description, instructions, reward, deadline, type, and logo upload.
- Full read access to submissions on each bounty.

### 🛡️ Admin Panel
- Role-gated admin workspace (admin wallet addresses configured server-side).
- Pending submissions review queue with approve/reject workflow.
- Platform-wide metrics dashboard.
- Data tables for bounties, posters, hunters, and payouts.

### 🔔 Notifications
- Real-time notification bell in the site header.
- Notifications for submission status changes (approved, rejected, pending review).
- Unread badge count with dismissal support.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Vanilla CSS with CSS custom properties (no Tailwind in landing/pages) |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL + Row Level Security) |
| **Wallet SDK** | [MeshSDK](https://meshjs.dev) (`@meshsdk/core`, `@meshsdk/react`) |
| **Blockchain Data** | [Blockfrost](https://blockfrost.io) (`@blockfrost/blockfrost-js`) |
| **Auth** | Custom JWT challenge-response via wallet signature |
| **Email** | [Resend](https://resend.com) (waitlist and notification emails) |
| **State / Forms** | React Hook Form, Zod, TanStack Query |
| **UI Primitives** | Radix UI (dialogs, tabs, dropdowns, tooltips) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 📁 Project Structure

```
cardano-bounties/
├── app/
│   ├── api/                  # Next.js API routes
│   │   ├── auth/             # Wallet challenge & verify endpoints
│   │   ├── bounties/         # CRUD for bounty listings
│   │   ├── submissions/      # Contribution submission endpoints
│   │   ├── dashboard/        # Poster-scoped data endpoints
│   │   ├── admin/            # Admin-only management endpoints
│   │   ├── metrics/          # Platform-wide stats
│   │   ├── notifications/    # Notification read/unread management
│   │   ├── upload/           # Project logo file uploads
│   │   ├── users/            # User profile endpoints
│   │   └── waitlist/         # Waitlist signup endpoint
│   ├── pages/                # Full-page React components
│   │   ├── ExploreBountiesPage.tsx
│   │   ├── BountyDetailsPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PosterOverviewPage.tsx
│   │   └── ...
│   ├── bounties/[id]/        # Dynamic bounty detail route
│   ├── explore/              # Explore page route
│   ├── dashboard/            # Poster/admin dashboard routes
│   ├── post-bounty/          # Bounty creation route
│   ├── globals.css           # Global design system & utility styles
│   └── layout.tsx            # Root layout with font + metadata
├── components/
│   ├── landing/              # Landing page sections (Hero, Footer, Header, etc.)
│   ├── dashboard/            # Dashboard shell and navigation
│   ├── wallet/               # WalletConnect & WalletProvider
│   ├── notifications/        # NotificationBell component
│   └── ui/                   # Shared Radix-based UI primitives
├── lib/                      # Server utilities (Supabase client, auth helpers)
├── hooks/                    # Custom React hooks
├── supabase/
│   └── migrations/           # SQL migration files for the database schema
├── scripts/                  # Build-time scripts (e.g., libsodium prep)
└── public/                   # Static assets and images
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18 or higher
- A **Supabase** project with the database migrations applied
- A **Blockfrost** API key (for Cardano chain data)
- A **Resend** API key (for email delivery)

### 1. Clone the repository

```bash
git clone https://github.com/Ayomishuga/Cardano-Bounties.git
cd Cardano-Bounties
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root (copy from `.env.example` if available):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Blockfrost
BLOCKFROST_PROJECT_ID=your-blockfrost-project-id

# JWT Auth
JWT_SECRET=your-strong-random-secret

# Admin wallets (comma-separated stake addresses)
ADMIN_WALLET_ADDRESSES=stake1...

# Email (Resend)
RESEND_API_KEY=re_...
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
```

### 4. Apply database migrations

Using the Supabase CLI:

```bash
supabase db push
```

Or apply the SQL files in `supabase/migrations/` manually through the Supabase Studio dashboard.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🔑 Wallet Authentication Flow

Cardano Bounties uses a cryptographic challenge-response flow instead of traditional email/password auth:

1. **Connect** — The user connects their Cardano wallet via MeshSDK.
2. **Challenge** — The frontend calls `POST /api/auth/challenge` with the wallet address. The server returns a unique nonce to sign.
3. **Sign** — The user signs the nonce message with their wallet's private key (in-browser, never shared).
4. **Verify** — The signed payload is sent to `POST /api/auth/verify`. The server uses Blockfrost to resolve the wallet's on-chain public key and verifies the signature.
5. **Session** — On success, the server issues a JWT stored in `sessionStorage`. All protected API calls include this token as a Bearer token in the `Authorization` header.

---

## 🗄️ Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `bounties` | Stores all bounty listings with reward, deadline, status, and instructions |
| `submissions` | Tracks contributor work submissions linked to bounties |
| `users` | Wallet-address-based user profiles |
| `notifications` | Per-user notification records |
| `waitlist` | Email signups from the landing page |

Row Level Security (RLS) is enabled on all tables. Posters can only manage their own bounties; contributors can only see their own submissions.

---

## 🤝 Contributing

Contributions are welcome! Whether you're fixing a bug, improving the UI, or adding a new feature — feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your changes don't break the existing wallet auth flow and that all API routes handle auth errors gracefully.

---

## 🌐 Community & Links

| | |
|---|---|
| **X (Twitter)** | [@cardanobounties](https://x.com/cardanobounties) |
| **Discord** | [Join our server](https://discord.gg/rbQ97RaNw) |
| **YouTube** | [@cardanobounties](https://youtube.com/@cardanobounties) |
| **GitHub** | [Ayomishuga/Cardano-Bounties](https://github.com/Ayomishuga/Cardano-Bounties) |

---

## 📄 License

This project is open source. See [LICENSE](./LICENSE) for details.

---

Built with ❤️ by [TechKR](https://x.com/TechKr_Team) and [Gimbalabs](https://gimbalabs.com).
