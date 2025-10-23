# Wallet Integration

This directory contains the wallet integration implementation for the Farcaster Prediction Market application, built with wagmi, viem, and Zustand.

## Overview

The wallet integration provides:
- Multi-wallet support (Coinbase Wallet, WalletConnect, MetaMask)
- Base network support (Mainnet and Sepolia testnet)
- Transaction management with error handling
- State management with Zustand
- React hooks for easy integration

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# RPC URLs
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Wrap Your App

Wrap your application with the `Web3Provider`:

```tsx
// app/layout.tsx
import { Web3Provider } from '@/lib/context/Web3Provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
```

## Usage

### Basic Wallet Connection

```tsx
import { Wallet } from '@/components/wallet';

export function Header() {
  return (
    <header>
      <Wallet showBalance />
    </header>
  );
}
```

### Using the Wallet Hook

```tsx
import { useWallet } from '@/lib/hooks/useWallet';

export function MyComponent() {
  const { address, chainId, balance, isConnected, isSupportedChain } = useWallet();

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  if (!isSupportedChain) {
    return <div>Please switch to Base network</div>;
  }

  return <div>Connected: {address}</div>;
}
```

### Sending Transactions

```tsx
import { useTransaction } from '@/lib/hooks/useTransaction';
import { TransactionStatus } from '@/components/wallet';

export function SendTransaction() {
  const { execute, status, hash, error } = useTransaction({
    onSuccess: (receipt) => {
      console.log('Transaction successful:', receipt);
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
    },
  });

  const handleSend = async () => {
    try {
      await execute({
        to: '0x...',
        value: parseEther('0.1'),
      });
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  return (
    <div>
      <button onClick={handleSend}>Send Transaction</button>
      <TransactionStatus status={status} hash={hash} error={error} />
    </div>
  );
}
```

### Contract Interactions

```tsx
import { useTransaction } from '@/lib/hooks/useTransaction';
import { usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';

export function ContractInteraction() {
  const publicClient = usePublicClient();
  const { execute, status } = useTransaction();

  const handleContractCall = async () => {
    const data = encodeFunctionData({
      abi: contractAbi,
      functionName: 'myFunction',
      args: [arg1, arg2],
    });

    await execute({
      to: contractAddress,
      data,
      value: 0n,
    });
  };

  return <button onClick={handleContractCall}>Call Contract</button>;
}
```

## Components

### Wallet

Main wallet component that combines all wallet functionality.

```tsx
<Wallet 
  showBalance={true}
  requiredChainId={8453}
  onConnect={(address) => console.log('Connected:', address)}
/>
```

### WalletConnect

Wallet connection button with connector selection.

```tsx
<WalletConnect 
  requiredChainId={8453}
  onConnect={(address) => console.log('Connected:', address)}
/>
```

### NetworkSwitcher

Network switching dropdown.

```tsx
<NetworkSwitcher />
```

### WalletBalance

Display wallet balance with optional actions.

```tsx
<WalletBalance showActions />
```

### TransactionStatus

Transaction status notification.

```tsx
<TransactionStatus 
  status={status}
  hash={hash}
  error={error}
  chainId={chainId}
/>
```

## Utilities

### Blockchain Utils

```tsx
import {
  formatAddress,
  formatEth,
  parseEth,
  getExplorerUrl,
  formatTimeRemaining,
} from '@/lib/blockchain/utils';

// Format address
const short = formatAddress('0x1234...5678'); // "0x1234...5678"

// Format ETH
const formatted = formatEth(parseEther('1.23456789')); // "1.2346"

// Parse ETH
const amount = parseEth('1.5'); // 1500000000000000000n

// Get explorer URL
const url = getExplorerUrl(8453, 'tx', txHash);

// Format time remaining
const time = formatTimeRemaining(timestamp); // "2d 5h"
```

### Transaction Helpers

```tsx
import {
  parseTransactionError,
  estimateGasWithBuffer,
  hasSufficientBalance,
} from '@/lib/blockchain/transaction';

// Parse error
const error = parseTransactionError(rawError);
console.log(error.code); // "USER_REJECTED"

// Estimate gas with buffer
const gas = await estimateGasWithBuffer(publicClient, transaction, 20);

// Check balance
const canSend = hasSufficientBalance(balance, amount, gas, gasPrice);
```

## State Management

The wallet state is managed with Zustand and automatically synced with wagmi:

```tsx
import { useWalletStore } from '@/lib/blockchain/walletStore';

const {
  address,
  chainId,
  balance,
  isConnected,
  isCorrectNetwork,
  setRequiredChainId,
  validateNetwork,
} = useWalletStore();
```

## Error Handling

Transaction errors are automatically parsed and categorized:

- `USER_REJECTED`: User rejected the transaction
- `INSUFFICIENT_FUNDS`: Not enough balance
- `GAS_ESTIMATION_FAILED`: Gas estimation failed
- `NETWORK_ERROR`: Network/RPC error
- `CONTRACT_REVERT`: Contract execution reverted
- `UNKNOWN_ERROR`: Other errors

## Supported Networks

- **Base Mainnet** (Chain ID: 8453)
- **Base Sepolia** (Chain ID: 84532)

## Supported Wallets

- Coinbase Wallet
- WalletConnect (any compatible wallet)
- MetaMask (injected)
- Any injected wallet

## Best Practices

1. Always check `isConnected` before showing wallet-dependent UI
2. Validate network with `isSupportedChain` before transactions
3. Use `useTransaction` hook for all transaction management
4. Show `TransactionStatus` component for user feedback
5. Handle errors gracefully with try-catch blocks
6. Estimate gas before sending transactions
7. Add buffer to gas estimates (default 20%)

## Testing

To test the wallet integration:

1. Connect with different wallets
2. Switch between Base Mainnet and Sepolia
3. Send test transactions on Sepolia
4. Test error scenarios (reject transaction, insufficient funds)
5. Test network switching

## Troubleshooting

### Wallet not connecting

- Check that `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Ensure wallet extension is installed and unlocked
- Try refreshing the page

### Wrong network

- Use the NetworkSwitcher component
- Check that the wallet supports Base network
- Add Base network manually if needed

### Transaction failing

- Check gas estimation
- Verify contract address and ABI
- Ensure sufficient balance
- Check network congestion

## Future Enhancements

- [ ] Add more wallet connectors (Ledger, Trezor)
- [ ] Implement transaction history
- [ ] Add transaction queueing
- [ ] Support for EIP-1559 gas pricing
- [ ] Multi-chain support beyond Base
