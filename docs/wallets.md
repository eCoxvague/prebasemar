# Wallets Guide — Integrating Wallets and Farcaster Auth

This document collects the wallet-related guidance required by Farcaster miniapps and Base integration. It synthesizes the project's design.md snippets and the Farcaster wallets guide.

Supported connectors

- Injected (MetaMask / Coinbase Wallet extension)
- Coinbase Wallet SDK (Smart Wallet)
- WalletConnect (mobile wallets)

Wagmi + viem setup (example)

- Use `wagmi` with `viem` chains `base` and `baseSepolia`. The design.md contains a working `config/wagmi.ts` sample; ensure env variables for RPC URLs and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` are set.

WalletConnect & deep linking

- For mobile flows, use WalletConnect v2 with a registered `projectId` from WalletConnect Cloud.
- Provide deep links / QR code flows in the Farcaster mini app UI.

Coinbase Smart Wallet

- The design uses `@coinbase/wallet-sdk` for Smart Wallet integration and forces smart wallet only behavior.
- When testing locally, ensure the correct chainId (8453 or 84532) is used in the `makeWeb3Provider` call.

Farcaster authentication

- Farcaster uses a separate auth flow (channel creation, SIWE signing) via `@farcaster/auth-client` (see design.md). The flow requires a relay and a SIWE redirect URI.
- For a Mini App, show the Farcaster frame and/or deep link for signing.

Common developer checks

- Wrong network errors: verify chainId reported by the wallet and prompt the user to switch networks.
- Insufficient funds: check `wallet.getBalance()` before sending txns and provide a helpful message with faucet link for Sepolia.
- User rejected transaction: handle provider errors and show friendly messages.

Troubleshooting

- WalletConnect connection fails: make sure `projectId` is correct and that CORS/relay endpoints allow your domain.
- Coinbase Smart Wallet not connecting: check SDK version and `overrideIsMetaMask` option.

References

- Farcaster wallets guide: https://miniapps.farcaster.xyz/docs/guides/wallets
- Wagmi docs: https://wagmi.sh
- Viem docs: https://viem.sh
