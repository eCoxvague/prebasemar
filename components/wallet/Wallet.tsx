'use client';

import { WalletConnect } from './WalletConnect';
import { NetworkSwitcher } from './NetworkSwitcher';
import { WalletBalance } from './WalletBalance';
import { useAccount } from 'wagmi';

interface WalletProps {
  requiredChainId?: number;
  onConnect?: (address: string) => void;
  showBalance?: boolean;
}

export function Wallet({
  requiredChainId,
  onConnect,
  showBalance = true,
}: WalletProps) {
  const { isConnected } = useAccount();

  return (
    <div className="flex items-center gap-3">
      {isConnected && (
        <>
          {showBalance && <WalletBalance showActions />}
          <NetworkSwitcher />
        </>
      )}
      <WalletConnect requiredChainId={requiredChainId} onConnect={onConnect} />
    </div>
  );
}
