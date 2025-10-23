# Project Structure

This document describes the folder structure and organization of the Farcaster Prediction Market project.

## Root Directory

```
farcaster-prediction-market/
├── .kiro/                      # Kiro specifications and settings
│   └── specs/
│       └── farcaster-prediction-market/
│           ├── design.md       # Technical design document
│           ├── requirements.md # Feature requirements
│           └── tasks.md        # Implementation task list
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── auth/                   # Authentication components
│   ├── wallet/                 # Wallet connection components
│   ├── market/                 # Market-related components
│   ├── betting/                # Betting components
│   └── profile/                # User profile components
├── lib/                        # Utility functions and helpers
│   ├── kv/                     # Vercel KV utilities
│   ├── blockchain/             # Blockchain utilities
│   └── utils/                  # General utilities
├── types/                      # TypeScript type definitions
│   └── index.ts                # Global types
├── contracts/                  # Smart contracts (Hardhat)
├── prisma/                     # Database schema (Phase 2)
│   └── schema.prisma           # Prisma schema
├── public/                     # Static assets
│   └── farcaster.json          # Farcaster Mini App manifest
├── docs/                       # Documentation
│   ├── getting-started.md
│   ├── base-integration.md
│   └── wallets.md
├── .env.example                # Environment variables template
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── .gitignore                  # Git ignore rules
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── README.md                   # Project overview
```

## Directory Descriptions

### `/app`
Next.js 14 App Router directory. Contains pages, layouts, and API routes.

### `/components`
Reusable React components organized by feature:
- **auth/**: Farcaster authentication components
- **wallet/**: Wallet connection and management
- **market/**: Market creation, listing, and details
- **betting/**: Bet placement and odds display
- **profile/**: User profile and statistics

### `/lib`
Utility functions and shared logic:
- **kv/**: Vercel KV cache helpers (sessions, markets, odds)
- **blockchain/**: Web3 utilities, contract interactions
- **utils/**: General helper functions

### `/types`
TypeScript type definitions for the entire application.

### `/contracts`
Smart contract development (Hardhat):
- Solidity contracts
- Deployment scripts
- Test files
- Contract ABIs and typechain types

### `/prisma`
Database schema for Phase 2 (PostgreSQL). Currently using blockchain-first approach with Vercel KV cache.

### `/public`
Static assets served directly:
- Images
- Fonts
- Farcaster manifest

### `/docs`
Project documentation and guides.

## Configuration Files

- **next.config.mjs**: Next.js configuration
- **tailwind.config.ts**: TailwindCSS theme and plugins
- **tsconfig.json**: TypeScript compiler options
- **.eslintrc.json**: ESLint rules
- **.prettierrc**: Code formatting rules
- **package.json**: Dependencies and npm scripts

## Development Workflow

1. **Specifications** (`.kiro/specs/`): Requirements, design, and tasks
2. **Implementation**: Follow task list in `tasks.md`
3. **Testing**: Unit tests, integration tests, E2E tests
4. **Deployment**: Vercel (frontend) + Base (smart contracts)

## Architecture Approach

**MVP (Current)**: Blockchain-first + Vercel KV cache
- All data stored on Base blockchain
- Vercel KV for caching and sessions
- No PostgreSQL database needed

**Phase 2**: Add PostgreSQL for advanced features
- Leaderboard and rankings
- Detailed analytics
- Notification history
- Dispute tracking

## Key Technologies

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Blockchain**: Solidity, Hardhat, Base (L2)
- **Web3**: wagmi, viem
- **Cache**: Vercel KV (Redis)
- **Auth**: Farcaster SDK
- **Deployment**: Vercel

## Getting Started

See [README.md](./README.md) for installation and setup instructions.
