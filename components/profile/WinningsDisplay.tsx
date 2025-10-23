'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, PREDICTION_MARKET_ABI } from '@/lib/blockchain/contract';

interface WinningsData {
  marketId: string;
  amount: string;
  marketTitle: string;
  status: number;
}

interface WinningsDisplayProps {
  userId?: string;
  autoRefresh?: boolean;
}

export default function WinningsDisplay({
  userId,
  autoRefresh = false,
}: WinningsDisplayProps) {
  const [winningsData, setWinningsData] = useState<WinningsData[]>([]);
  const [totalClaimable, setTotalClaimable] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingMarketId, setClaimingMarketId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const fetchWinnings = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/winnings/${userId || address}?address=${address}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch winnings');
      }

      const data = await response.json();

      if (data.success) {
        setWinningsData(data.data.winnings);
        setTotalClaimable(data.data.totalClaimable);
      } else {
        throw new Error(data.error || 'Failed to fetch winnings');
      }
    } catch (err) {
      console.error('Error fetching winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch winnings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinnings();

    if (autoRefresh) {
      const interval = setInterval(fetchWinnings, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [address, userId, autoRefresh]);

  const handleClaim = async (marketId: string) => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setClaimingMarketId(marketId);
      setError(null);
      setSuccessMessage(null);

      // Call API to validate claim
      const response = await fetch('/api/winnings/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketId,
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
          marketId,
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

      // Refresh winnings data
      setTimeout(() => {
        fetchWinnings();
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
    } finally {
      setClaimingMarketId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">
          Please connect your wallet to view winnings
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading winnings...</p>
        </div>
      </div>
    );
  }

  const totalClaimableEth = formatEther(BigInt(totalClaimable));
  const hasWinnings = winningsData.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Winnings</h2>
        <button
          onClick={fetchWinnings}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          disabled={isLoading}
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Total Claimable */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
        <p className="text-sm text-gray-600 mb-2">Total Claimable</p>
        <p className="text-4xl font-bold text-gray-900">
          {parseFloat(totalClaimableEth).toFixed(4)} ETH
        </p>
        {hasWinnings && (
          <p className="text-sm text-gray-600 mt-2">
            From {winningsData.length} market{winningsData.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Winnings List */}
      {hasWinnings ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Claimable Markets
          </h3>
          {winningsData.map((winning) => {
            const amountEth = formatEther(BigInt(winning.amount));
            const isClaiming = claimingMarketId === winning.marketId;

            return (
              <div
                key={winning.marketId}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {winning.marketTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Market ID: {winning.marketId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {parseFloat(amountEth).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(winning.marketId)}
                  disabled={isClaiming}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
                      Claiming...
                    </span>
                  ) : (
                    'Claim Winnings'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-600 font-medium">No winnings to claim</p>
          <p className="text-sm text-gray-500 mt-2">
            Win bets on resolved markets to see claimable winnings here
          </p>
        </div>
      )}
    </div>
  );
}
