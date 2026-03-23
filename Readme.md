# GlassGive — Transparent Charity Tracker

> *Democratising charity through radical transparency.*

GlassGive is a transparent charity and grant management platform built on Hedera Hashgraph. Every donation, campaign verification, and fund release is immutably logged on-chain — making misuse of funds impossible to hide. Charities submit campaigns, a multi-signature admin committee verifies them, a smart contract escrow holds donor funds, and NFT receipts are minted as proof of every contribution.

---

## Table of Contents

- [GlassGive — Transparent Charity Tracker](#glassgive--transparent-charity-tracker)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
    - [For Donors](#for-donors)
    - [For Campaign Creators](#for-campaign-creators)
    - [For Admins](#for-admins)
    - [Platform](#platform)
  - [Architecture](#architecture)
  - [Smart Contracts](#smart-contracts)
    - [GlassGiveFactory.sol](#glassgivefactorysol)
    - [GlassGiveCampaign.sol](#glassgivecampaignsol)
    - [Events](#events)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
    - [Installation](#installation)
    - [Running the Backend](#running-the-backend)
    - [Running the Frontend](#running-the-frontend)
  - [Deployment](#deployment)
    - [Deploy the NFT Collection](#deploy-the-nft-collection)
    - [Deploy the Factory Contract](#deploy-the-factory-contract)
    - [Seed an Admin](#seed-an-admin)
  - [API Reference](#api-reference)
    - [Authentication](#authentication)
    - [Requests (Campaigns)](#requests-campaigns)
    - [Donations](#donations)
    - [Admin](#admin)
    - [Dashboard](#dashboard)
  - [Smart Contract Integration](#smart-contract-integration)
  - [Database Schema](#database-schema)
  - [Contributing](#contributing)
  - [License](#license)

---

## Overview

The charitable giving space suffers from a deep trust deficit. Donors rarely know where their money goes, and charities have little way to prove impact. GlassGive solves this by putting the entire donation lifecycle on-chain:

1. A charity or grant seeker submits a campaign request with supporting documents.
2. A multi-signature admin committee reviews and verifies the request.
3. Upon verification, a campaign escrow contract is deployed automatically on Hedera.
4. Donors contribute HBAR directly to the escrow contract and receive an HTS NFT receipt.
5. All events — donations, approvals, fund releases — are logged immutably to a Hedera Consensus Service (HCS) topic.
6. After the campaign deadline, the requester triggers fund release; 97% goes to the charity and 3% to the platform treasury.

Everything is auditable by anyone, at any time, on-chain.

---

## Features

### For Donors
- Donate to verified charity or grant campaigns using HBAR
- Receive an NFT donation receipt (HTS) for every contribution
- View full on-chain audit trail of how funds are used
- Access personal donor dashboard with donation history and NFT receipts
- Login with Google (Magic.link) — no seed phrases required

### For Campaign Creators
- Submit charity or grant requests with metadata, images, and supporting documents
- Documents uploaded to Hedera File Service (HFS) for decentralised storage
- Track campaign status from pending verification → live → funded
- Monitor on-chain escrow balance and release funds after deadline
- Post impact updates that are permanently logged on HCS

### For Admins
- Multi-signature verification flow — a configurable threshold of admin signatures is required before a campaign goes live
- Admin portal with role management (promote/demote users)
- On-chain admin sync — add/remove admins directly on the Factory contract
- Deploy campaigns to Hedera with one click after signature threshold is met
- Full user directory with contract admin status

### Platform
- Real-time public dashboard with total funds raised, active campaigns, and top causes
- Explore page with search and category filtering
- Mirror Node background indexer — automatically syncs on-chain donation events to the database
- Redis caching for high-performance public endpoints
- Swagger API documentation at `/api/docs`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  Magic.link OAuth │ RainbowKit Wallet │ Wagmi Contract Hooks │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API (JWT Auth)
┌────────────────────────────▼────────────────────────────────┐
│                      Backend (Express.js)                    │
│                                                              │
│  Auth       Requests    Donations    Admin     Dashboard     │
│  Controller Controller  Controller  Controller Controller    │
│                                                              │
│  ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────────────┐   │
│  │ Magic.link│ │  HFS   │ │  HTS   │ │  ContractService  │   │
│  │  Service  │ │Service │ │Service │ │  (Hedera SDK)    │   │
│  └──────────┘ └────────┘ └────────┘ └──────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Background Jobs                            │   │
│  │  Mirror Node Poller (HCS) │ Contract Log Indexer     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  PostgreSQL (Prisma ORM) │ Redis Cache                       │
└────────────────────────────┬────────────────────────────────┘
                             │ Hedera JS SDK
┌────────────────────────────▼────────────────────────────────┐
│                    Hedera Testnet                             │
│                                                              │
│  HSCS (Smart Contracts)   HCS Topics    HFS Files    HTS NFT │
│  ┌──────────────────┐                                        │
│  │ GlassGiveFactory │ ──deploys──► GlassGiveCampaign[]       │
│  └──────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### GlassGiveFactory.sol

The factory is deployed once and is responsible for deploying all campaign escrow contracts. Only the owner can call `createCampaign()`.

| Function | Description |
|---|---|
| `createCampaign(requester, deadline, type)` | Deploys a new GlassGiveCampaign |
| `addAdmin(address)` | Grants admin role on the factory |
| `removeAdmin(address)` | Revokes admin role |
| `isAdmin(address)` | Returns whether an address is an admin |
| `getCampaigns()` | Returns all deployed campaign addresses |

### GlassGiveCampaign.sol

One contract per verified campaign. Holds donor funds in escrow until deadline.

| Function | Description |
|---|---|
| `donate()` | Accepts HBAR, tracks donation, mints HTS NFT receipt to donor |
| `releaseFunds()` | Callable after deadline — stages 97% payout to requester, 3% fee to treasury |
| `withdraw()` | Requester or treasury pulls their staged funds |
| `totalRaised()` | Returns total HBAR raised |
| `released()` | Returns whether funds have been released |
| `pendingWithdrawals(address)` | Returns amount available to withdraw for an address |

### Events

```solidity
// GlassGiveCampaign
event DonationReceieved(address indexed donor, uint256 amount, uint256 timestamp);
event FundsReleased(address indexed requester, uint256 payout, uint256 fee, uint256 timestamp);

// GlassGiveFactory
event CampaignCreated(address indexed campaign, address indexed requester, CampaignType, uint256 deadline, uint256 timestamp);
event AdminAdded(address indexed admin);
event AdminRemoved(address indexed admin);
```

---

## Tech Stack

**Hedera Services**
- Smart Contract Service (HSCS) — campaign escrow contracts
- Consensus Service (HCS) — immutable audit trail for all events
- File Service (HFS) — decentralized metadata and document storage
- Token Service (HTS) — NFT donation receipts
- Mirror Node — on-chain event indexing and state queries

**Smart Contracts**
- Solidity ^0.8.23 + Foundry
- OpenZeppelin (ReentrancyGuard)
- Hedera precompiles (HederaTokenService)

**Backend**
- Node.js + TypeScript + Express.js
- Prisma ORM + PostgreSQL (Neon)
- Redis (caching and polling state)
- Hedera JS SDK + Ethers.js
- Magic Admin SDK (auth)
- Cloudinary (image storage)

**Frontend**
- Next.js + TypeScript + Tailwind CSS
- Wagmi + Viem + RainbowKit (wallet interactions)
- Magic.link SDK (account abstraction via Google OAuth)
- React Query + React Hot Toast

**Auth & Security**
- JWT (session tokens)
- Magic.link (passwordless / OAuth login)
- Multi-signature admin verification flow

---

## Project Structure

```
glassgive/
├── src/                          # Backend source
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server entry point
│   ├── config/                   # DB, Hedera, Redis, Magic configs
│   ├── controllers/              # Request handlers
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   ├── dashboardController.ts
│   │   ├── donationController.ts
│   │   └── requestController.ts
│   ├── routes/                   # Express routers
│   ├── middleware/               # Auth, error handling, guards
│   ├── services/                 # Business logic
│   │   ├── accountService.ts     # Hedera account creation
│   │   ├── cacheService.ts       # Redis wrapper
│   │   ├── contractService.ts    # HSCS interactions
│   │   ├── hcsService.ts         # HCS topic + message
│   │   ├── hfsService.ts         # HFS file upload
│   │   ├── htsService.ts         # NFT mint + transfer
│   │   ├── magicService.ts       # Magic.link verification
│   │   ├── mirrorNodeService.ts  # Mirror Node REST calls
│   │   ├── multiSigService.ts    # Multi-sig verification flow
│   │   └── storageService.ts     # Cloudinary upload
│   ├── jobs/                     # Background pollers
│   │   ├── mirrorNodePoller.ts   # HCS message indexer
│   │   └── contractLogPoller.ts  # Donation event indexer
│   ├── contracts/                # Solidity source files
│   │   ├── GlassGiveCampaign.sol
│   │   └── GlassGiveFactory.sol
│   └── interfaces/               # Solidity interfaces
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── scripts/
│   ├── createNftCollection.ts    # Deploy HTS NFT collection
│   ├── deployFactory.ts          # Deploy factory contract
│   └── seedAdmin.ts              # Promote a user to admin
│
└── frontend/                     # Next.js frontend (src/pages/)
    ├── pages/
    │   ├── index.tsx             # Home / public dashboard
    │   ├── explore.tsx           # Browse campaigns
    │   ├── donate.tsx            # Donation page
    │   ├── login.tsx             # User login
    │   ├── admin/login.tsx       # Admin login portal
    │   ├── dashboard.tsx         # Donor dashboard
    │   └── dashboard/
    │       ├── admin.tsx         # Admin verification portal
    │       ├── charity.tsx       # Charity creator dashboard
    │       └── grant.tsx         # Grant creator dashboard
    ├── hooks/
    │   └── useCampaign.ts        # Wagmi hooks for contract calls
    └── services/
        └── authService.ts        # Frontend auth helpers
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database (or Neon account)
- Redis instance (local or Upstash)
- Hedera Testnet account — [portal.hedera.com](https://portal.hedera.com)
- Magic.link account — [magic.link](https://magic.link)
- Cloudinary account — [cloudinary.com](https://cloudinary.com)

### Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5050
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host/glassgive

# Redis
REDIS_URL=redis://127.0.0.1:6380

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Hedera
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e...

# Smart Contracts
FACTORY_CONTRACT_ID=0x...          # EVM address of deployed GlassGiveFactory
NFT_TOKEN_ID=0.0.XXXXXXX           # HTS NFT collection token ID

# Magic.link
MAGIC_SECRET_KEY=sk_live_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin Config
ADMIN_SIG_THRESHOLD=2              # Number of admin signatures required to activate a campaign

# Mirror Node (optional override)
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
MIRROR_POLL_INTERVAL=60000         # Milliseconds between Mirror Node polls

# CORS
CORS_ORIGIN=http://localhost:3000
```

Create a `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_NFT_TOKEN_ID=0.0.XXXXXXX
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/glassgive.git
cd glassgive

# Install backend dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Install frontend dependencies
cd frontend && npm install
```

### Running the Backend

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:5050/api`.
Swagger docs will be at `http://localhost:5050/api/docs`.

### Running the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## Deployment

Follow this sequence exactly to set up a fresh deployment.

### Deploy the NFT Collection

This creates the HTS NFT collection that will be used for donation receipts.

```bash
npm run script:nft
```

Copy the output **NFT Token ID** and set it as `NFT_TOKEN_ID` in your `.env`.

### Deploy the Factory Contract

```bash
npm run deploy:factory -- <treasury-evm-address>
```

Replace `<treasury-evm-address>` with the EVM-format `0x...` wallet that will receive the 3% platform fee.

Copy the output **Contract EVM Address** and set it as `FACTORY_CONTRACT_ID` in your `.env`.

### Seed an Admin

After a user logs in for the first time, promote them to admin:

```bash
npm run seed:admin -- <wallet-address-or-hedera-account-id>
```

---

## API Reference

Full interactive documentation is available via Swagger UI at `/api/docs` when the server is running.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/magic` | Login with Magic.link DID token |
| POST | `/api/auth/wallet` | Login with wallet signature |
| POST | `/api/auth/admin/magic` | Admin login with Magic.link |
| POST | `/api/auth/admin/wallet` | Admin login with wallet |

### Requests (Campaigns)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/requests` | — | List live/funded campaigns |
| GET | `/api/requests/:id` | — | Get campaign details |
| POST | `/api/requests` | ✅ User | Create charity or grant request |
| POST | `/api/requests/:id/impact-updates` | ✅ Creator | Post an impact update |

### Donations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/donations` | — | List donations |
| POST | `/api/donations` | ✅ User | Record a donation + mint NFT |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/pending` | ✅ Admin | List pending requests |
| POST | `/api/admin/signatures` | ✅ Admin | Submit verification signature |
| POST | `/api/admin/approve` | ✅ Admin | Approve and deploy campaign |
| POST | `/api/admin/reject` | ✅ Admin | Reject a pending request |
| GET | `/api/admin/users` | ✅ Admin | List all users |
| POST | `/api/admin/role` | ✅ Admin | Update user role |
| POST | `/api/admin/contract-sync` | ✅ Admin | Sync admin status on-chain |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | — | Public platform stats |
| GET | `/api/dashboard/me` | ✅ User | Personal impact stats |

---

## Smart Contract Integration

The integration between the backend and smart contracts follows a strict sequence. See [INTEGRATION.md](./INTEGRATION.md) for the complete spec including events, parameters, Mirror Node endpoints, and the exact order of operations.

**Key network details:**

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Hedera Testnet | 296 | `https://testnet.hashio.io/api` |
| Hedera Mainnet | 295 | `https://mainnet.hashio.io/api` |

---

## Database Schema

The platform uses PostgreSQL with the following core models:

- **User** — platform accounts linked to Magic issuer ID, Hedera account ID, and/or EVM wallet address
- **Request** — charity or grant campaigns with status, HCS topic, HFS file ID, and contract address
- **Donation** — individual donations with NFT serial numbers and transaction hashes
- **AdminSignature** — multi-sig verification records per request
- **HcsMessage** — indexed HCS topic messages synced from Mirror Node
- **ImpactUpdate** — on-chain logged impact reports posted by campaign creators

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure all new backend code is TypeScript with proper types, and all on-chain interactions go through the appropriate Hedera service layer.

---

## License

<!-- MIT License — see [LICENSE](./LICENSE) for details. -->

---

Built with ❤️ on Hedera Hashgraph for the Hello Future: Apex Hackathon 2026.