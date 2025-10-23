'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, PREDICTION_MARKET_ABI } from '@/lib/blockchain/contract';
import type { CachedMarket } from '@/lib/kv/types';

interface ClaimWinningsButtonProps {
  market: CachedMarket;
  onSuccess?: () => void;
}

export default function ClaimWinningsButton({
  market,
  onSuccess,
}: ClaimWinningsButtonProps) {
  const [claimableAmount, setClaimableAmount] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Check if market is resolved
  const isResolved = market.status === 2;

  useEffect(() => {
    const fetchClaimableAmount = async () => {
      if (!address || !isResolved) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/winnings/${address}?address=${address}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Find winnings for this specific market
            const marketWinnings = data.data.winnings.find(
              (w: any) => w.marketId === market.marketId
            );
            if (marketWinnings) {
              setClaimableAmount(marketWinnings.amount);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching claimable amount:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaimableAmount();
  }, [address, market.marketId, isResolved]);

  const handleClaim = async () => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsClaiming(true);
      setError(null);
      setSuccessMessage(null);

      // Call API to validate claim
      const response = await fetch('/api/winnings/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: market.marketId,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to validate claim');
      }

      // Execute smart contract transaction
      const { contractCall } = data.data;
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      setSuccessMessage('Transaction submitted. Waiting for confirmation...');

      // Confirm claim with API
      const confirmResponse = await fetch('/api/winnings/claim/confirm', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId: market.marketId,
          walletAddress: address,
          txHash: hash,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (!confirmData.success) {
        console.error('Failed to confirm claim:', confirmData.error);
      }

      setSuccessMessage(
        `Winnings claimed successfully! Transaction: ${hash.slice(0, 10)}...`
      );

      // Reset claimable amount
      setClaimableAmount('0');

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
    } finally {
      setIsClaiming(false);
    }
  };

  // Don't show if market is not resolved
  if (!isResolved) {
    return null;
  }

  // Don't show if not connected
  if (!isConnected) {
    return null;
  }

  // Don't show if loading or no claimable amount
  if (isLoading || BigInt(claimableAmount) === 0n) {
    return null;
  }

  const amountEth = formatEther(BigInt(claimableAmount));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🎉 You Won!
          </h3>
          <p className="text-sm text-gray-600">
            Congratulations! You have winnings to claim from this market.
          </p>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-1">Claimable Amount</p>
        <p className="text-3xl font-bold text-green-600">
          {parseFloat(amountEth).toFixed(4)} ETH
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isClaiming ? (
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
            Claiming Winnings...
          </span>
        ) : (
          'Claim Winnings'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Transaction will be sent to your wallet for confirmation
      </p>
    </div>
  );
}
