# Cardano Bounties — Project Overview

> **Purpose:** High-level description of what this project is, who it's for, and what problems it solves. Read this first before any other spec file.

---

## What Is This?

Cardano Bounties is a Web3 platform built on the Cardano blockchain where users can post tasks with ADA rewards (bounties) and contributors can submit work to earn those rewards. It bridges traditional bounty-board mechanics with on-chain payment guarantees via MeshSDK.

---

## Problem It Solves

Traditional bounty platforms rely on trust — posters may not pay, or payments are delayed. Cardano Bounties removes this by locking the ADA reward in escrow at the time of posting, guaranteeing payment the moment a submission is approved.

---

## Target Users

- **Open-source projects** needing contributors for specific tasks
- **DAOs and Cardano ecosystem projects** wanting to incentivise community work
- **Freelancers and developers** in the Cardano ecosystem looking for paid work

---

## Core Principles

- **Lean first** — ship a working admin-managed v1 before adding complexity
- **On-chain trust, off-chain speed** — Supabase handles data/search; blockchain handles payments
- **Wallet = identity** — no passwords, no email accounts, stake key is the user
- **Admin-controlled quality** — all bounties and submissions reviewed by admin in v1

---

## Project Status

> See `PROGRESS.md` for detailed task tracking.

Currently in active development. Core API routes are being built. Deployment target is Vercel.

---

## Key Constraints

- All bounties must be approved by the admin before going live
- All submissions are reviewed and approved by the admin (not the poster) in v1
- One submission per contributor per bounty — no re-submissions after rejection
- ADA must be locked in escrow before a bounty is listed
- Next.js 16 uses Turbopack by default — production builds must use `--webpack` flag due to libsodium/MeshSDK ESM incompatibility (see `vercel.json`)

---

## Out of Scope (v1)

- Peer-to-peer review (poster reviewing their own bounty submissions)
- Dispute resolution
- Multi-winner bounties
- Token rewards (ADA only)
- On-chain voting or governance
- Mobile wallet support (browser extension wallets only)

---

## Related Spec Files

| File | Purpose |
|---|---|
| `PLATFORM_GUIDE.md` | Full end-to-end flow — flows, statuses, API routes |
| `ARCHITECTURE.md` | Folder structure, data models, technical decisions |
| `PROGRESS.md` | What's built, what's in progress, what's next |