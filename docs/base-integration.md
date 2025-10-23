# Base Integration — RPC, Hardhat, and Deployment

This file summarizes the minimal steps to integrate with Base (mainnet and Sepolia testnet), based on the project's design snippets and the Base docs.

1) RPC configuration

- Use a reliable RPC provider (Alchemy, QuickNode, or Coinbase RPC). Put URLs in env:
  - NEXT_PUBLIC_BASE_RPC_URL
  - NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
  - BASE_RPC_URL
  - BASE_SEPOLIA_RPC_URL

2) Hardhat config (high level)

- Ensure `hardhat.config.ts` contains the `base` and `baseSepolia` networks with correct chainId and RPC URL. Example is already present in design.md — confirm `process.env.PRIVATE_KEY` is set for deployment.

3) Local testing

- Use Hardhat's local node for fast iteration:

    npx hardhat node

- Run tests against the local node or forked Base network.

4) Deployment

- Deploy script: `scripts/deploy.ts` uses env vars OWNER_ADDRESS, PRIVATE_KEY, and RPC URLs. Example in design.md shows creation fee and platform fee constructor args.

- To deploy to Sepolia:

    npx hardhat run --network baseSepolia scripts/deploy.ts

- To deploy to mainnet:

    npx hardhat run --network base scripts/deploy.ts

5) Verification

- Use `hardhat-etherscan` plugin configured for Base API endpoints. The design.md includes a sample `etherscan` config using `BASESCAN_API_KEY`.

6) Gas and paymaster

- The design includes an optional paymaster/gasless flow. If you plan to support gasless txns, configure PAYMASTER_URL and implement server-side sponsor logic.

7) Wallets & chain IDs

- Base mainnet chainId: 8453
- Base Sepolia chainId: 84532

8) Security & best-practices

- Keep PRIVATE_KEY and OWNER_ADDRESS secure (use vault or CI secrets). Do not commit `.env` to git.
- Run contract static analysis / slither and a security audit for production.

Resources
- Base docs: https://docs.base.org/get-started/build-app
- Base RPC endpoints: check your provider docs (Alchemy/QuickNode)
- Hardhat docs: https://hardhat.org
