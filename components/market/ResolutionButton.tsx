'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import ResolutionModal from './ResolutionModal';
import type { CachedMarket } from '@/lib/kv/types';
import { CONTRACT_ADDRESS, PREDICTION_MARKET_ABI } from '@/lib/blockchain/contract';

interface ResolutionButtonProps {
  market: CachedMarket;
  onSuccess?: () => void;
}

export default function ResolutionButton({
  market,
  onSuccess,
}: ResolutionButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Check if current user is the creator
  const isCreator =
    isConnected &&
    address &&
    address.toLowerCase() === market.creator.toLowerCase();

  // Check if market has ended
  const hasEnded = market.endTime <= Date.now() / 1000;

  // Check if market is active
  const isActive = market.status === 0;

  // Only show button if user is creator, market has ended, and is still active
  if (!isCreator || !hasEnded || !isActive) {
    return null;
  }

  const handleResolve = async (winningOutcomeId: number) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsResolving(true);
      setError(null);

      // Call API to validate resolution
      const response = await fetch(`/api/markets/${market.marketId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winningOutcomeId,
          creatorAddress: address,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to validate resolution');
      }

      // Execute smart contract transaction
      const { contractCall } = data.data;
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      // Wait for transaction confirmation
      setSuccessMessage('Transaction submitted. Waiting for confirmation...');

      // Confirm resolution with API
      const confirmResponse = await fetch(
        `/api/markets/${market.marketId}/resolve/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            txHash: hash,
          }),
        }
      );

      const confirmData = await confirmResponse.json();

      if (!confirmData.success) {
        console.error('Failed to confirm resolution:', confirmData.error);
      }

      setSuccessMessage(
        `Market resolved successfully! Transaction: ${hash.slice(0, 10)}...`
      );

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error resolving market:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve market');
      throw err;
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Market Resolution
            </h3>
            <p className="text-sm text-gray-600">
              This market has ended. As the creator, you can now resolve it by
              selecting the winning outcome.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          disabled={isResolving}
          className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isResolving ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Resolving Market...
            </span>
          ) : (
            'Resolve Market'
          )}
        </button>
      </div>

      {showModal && (
        <ResolutionModal
          market={market}
          onConfirm={handleResolve}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
