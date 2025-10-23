# Farcaster Prediction Market — Workspace Docs

This repository contains design and requirements specs for the Farcaster Prediction Market mini app (see `.kiro/specs/farcaster-prediction-market`).

This README summarizes what's present and what's missing vs. the three reference guides you asked me to check:

Reference documents to compare against:
- Farcaster Mini Apps - Getting Started: https://miniapps.farcaster.xyz/docs/getting-started
- Base - Build an App: https://docs.base.org/get-started/build-app
- Farcaster Mini Apps - Wallets Guide: https://miniapps.farcaster.xyz/docs/guides/wallets

What exists in this workspace:
- `.kiro/specs/farcaster-prediction-market/design.md` — Detailed design doc (architecture, contracts, prisma schema, Farcaster & Base integration snippets).
- `.kiro/specs/farcaster-prediction-market/requirements.md` — Requirements and acceptance criteria.

Missing or incomplete items (summary):
1. A developer-focused Getting Started guide that walks through cloning, installing dependencies, running dev servers, environment variables, and running contract deployments on Base. The design doc has snippets but no step-by-step developer guide.
2. A detailed Base-specific integration guide covering RPC setup, metamask/coinbase wallet instructions for developers, local testnet usage, Hardhat config examples, and verifications steps tailored to Base docs formatting.
3. A Wallets guide with copyable examples for integrating Farcaster Mini App wallets and WalletConnect, including deep link / QR flows and explicit steps to obtain WalletConnect project IDs and hook into Farcaster's viem connector. Existing files contain snippets but lack the end-to-end flow and troubleshooting tips from the wallets guide.
4. A concise `public/farcaster.json` manifest file in the project root. The design doc includes an example but it's not present as a workspace file outside `.kiro`.
5. A top-level `.env.example` file at repo root (the design doc includes an env example but it's inside `.kiro`).

What I'll add now:
- `docs/getting-started.md` — Developer getting started with commands and env setup.
- `docs/base-integration.md` — Focused Base integration guide (RPC, Hardhat, deployment tips)
- `docs/wallets.md` — Wallet integration guide (wagmi, walletconnect, Farcaster auth highlights)
- `public/farcaster.json` — Mini app manifest (copy of the example in design.md)
- `.env.example` — Top-level environment variables example (from design.md)

I will not modify `.kiro` specs files; I'll create the docs and artifacts at the repo root so they are discoverable.

Next: I'll create the files mentioned above.
