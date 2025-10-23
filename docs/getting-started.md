# Getting Started — Farcaster Prediction Market

This guide helps a developer set up the project locally, run the frontend, run the backend APIs, run smart contract tests, and deploy to Base (testnet/mainnet). It combines required steps from the project design and the Farcaster miniapps getting-started guide.

Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm or npm
- Git
- Docker (optional — for Postgres/Redis local instances)
- A local or remote PostgreSQL database and Redis instance
- Hardhat + ethers (for contracts)
- An RPC provider for Base (Alchemy / QuickNode / public RPC)

Quick start

1) Clone

    git clone <repo-url> .

2) Install

    # using npm
    npm install

    # or using pnpm
    pnpm install

3) Create environment file

Copy the example and fill values:

    cp .env.example .env

Set `DATABASE_URL`, `NEXT_PUBLIC_BASE_RPC_URL` (or local RPC), `PRIVATE_KEY`, `JWT_SECRET`, and any Farcaster keys.

4) Start dependent services

Option A — Docker (quick):

    docker run --name pm-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=prediction_market -p 5432:5432 -d postgres
    docker run --name pm-redis -p 6379:6379 -d redis

Option B — use managed Postgres/Redis or local installs.

5) Run database migrations (Prisma)

    npx prisma migrate dev --name init

6) Run frontend (Next.js)

    npm run dev

7) Run backend + websocket server

If the project uses a single Next.js app with API routes and socket server, the `npm run dev` should cover both. Otherwise run:

    # Example: start API server
    npm run dev:api

8) Smart contracts (optional)

Run tests locally against Hardhat network:

    npx hardhat test

Deploy to Base Sepolia (testnet):

    npx hardhat run --network baseSepolia scripts/deploy.ts

Deploy to Base mainnet:

    npx hardhat run --network base scripts/deploy.ts

Common issues & troubleshooting
- Missing env values: check `.env` and fill `NEXT_PUBLIC_BASE_RPC_URL`, `PRIVATE_KEY`, and `DATABASE_URL`.
- Wallet wrong network: ensure wallets are connected to Base chainId (8453) or Base Sepolia (84532).
- Farcaster auth: Farcaster auth uses a relay and SIWE flow; use keys from your Farcaster developer dashboard.

Further reading
- Farcaster Mini Apps getting-started: https://miniapps.farcaster.xyz/docs/getting-started
- Base docs: https://docs.base.org/get-started/build-app
