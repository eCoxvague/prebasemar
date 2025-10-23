'use client';

import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';

interface WalletBalanceProps {
  address?: string;
  showActions?: boolean;
}

export function WalletBalance({ address, showActions = false }: WalletBalanceProps) {
  const { address: connectedAddress } = useAccount();
  const displayAddress = address || connectedAddress;

  const { data: balance, isLoading } = useBalance({
    address: displayAddress as `0x${string}`,
  });

  if (!displayAddress) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  const formattedBalance = balance
    ? parseFloat(formatEther(balance.value)).toFixed(4)
    : '0.0000';

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        <span className="font-semibold text-gray-900">{formattedBalance}</span>
        <span className="text-gray-600 ml-1">{balance?.symbol || 'ETH'}</span>
      </div>
      {showActions && (
        <button
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
          onClick={() => {
            // TODO: Implement add funds functionality
            window.open('https://bridge.base.org/', '_blank');
          }}
        >
          Add Funds
        </button>
      )}
    </div>
  );
}
