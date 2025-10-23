'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { chains, getChainName, isSupportedChain } from '@/lib/blockchain/wagmi';

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [showNetworks, setShowNetworks] = useState(false);

  if (!isConnected) {
    return null;
  }

  const currentChainName = getChainName(chainId);
  const isSupported = isSupportedChain(chainId);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNetworks(!showNetworks)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isSupported
            ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            : 'text-white bg-red-600 hover:bg-red-700'
        }`}
      >
        {isPending ? 'Switching...' : currentChainName}
      </button>

      {showNetworks && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNetworks(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Switch Network
              </h3>
              <div className="space-y-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      switchChain({ chainId: chain.id });
                      setShowNetworks(false);
                    }}
                    disabled={isPending || chainId === chain.id}
                    className={`w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      chainId === chain.id
                        ? 'bg-blue-50 text-blue-700 cursor-default'
                        : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{chain.name}</span>
                      {chainId === chain.id && (
                        <span className="text-xs text-blue-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
