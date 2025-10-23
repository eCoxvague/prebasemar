import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Get environment variables
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const baseSepoliaRpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// Validate required environment variables
if (!walletConnectProjectId) {
  console.warn(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.'
  );
}

// Configure chains
export const chains = [base, baseSepolia] as const;

// Create wagmi config
export const config = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'Farcaster Prediction Market',
      appLogoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    }),
    // WalletConnect
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            metadata: {
              name: 'Farcaster Prediction Market',
              description: 'Decentralized prediction market on Base',
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              icons: [`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`],
            },
            showQrModal: true,
          }),
        ]
      : []),
    // Injected wallets (MetaMask, etc.)
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  },
  ssr: true,
});

// Export chain IDs for easy reference
export const CHAIN_IDS = {
  BASE_MAINNET: base.id,
  BASE_SEPOLIA: baseSepolia.id,
} as const;

// Helper to check if chain is supported
export function isSupportedChain(chainId: number): boolean {
  return chainId === base.id || chainId === baseSepolia.id;
}

// Helper to get chain name
export function getChainName(chainId: number): string {
  switch (chainId) {
    case base.id:
      return 'Base';
    case baseSepolia.id:
      return 'Base Sepolia';
    default:
      return 'Unknown';
  }
}
