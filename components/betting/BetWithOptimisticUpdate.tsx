'use client';

import { useState, useCallback } from 'react';
import { parseEther, formatEther } from 'viem';
import { useOptimisticUpdate } from '@/lib/hooks/useOptimisticUpdate';
import { createOptimisticMarketUpdate } from '@/lib/utils/cacheUpdates';
import type { CachedMarket } from '@/lib/kv/types';

interface BetWithOptimisticUpdateProps {
  market: CachedMarket;
  outcomeId: number;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Betting component with optimistic UI updates
 * 
 * Immediately updates the UI when user places a bet, then confirms
 * with blockchain. Rolls back on error.
 */
export default function BetWithOptimisticUpdate({
  market: initialMarket,
  outcomeId,
  onSuccess,
  onError,
}: BetWithOptimisticUpdateProps) {
  const [betAmount, setBetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outcome = initialMarket.outcomes.find(
    (o) => o.outcomeId === outcomeId
  );

  const [txHash, setTxHash] = useState<string>('');

  const {
    data: market,
    execute,
    isOptimistic,
    isUpdating,
    error,
  } = useOptimisticUpdate<CachedMarket>({
    updateFn: async () => {
      // Place bet via API
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: initialMarket.marketId,
          outcomeId,
          amount: parseEther(betAmount).toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place bet');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to place bet');
      }

      // Store transaction hash
      if (result.data?.txHash) {
        setTxHash(result.data.txHash);
      }

      // Return updated market data
      return result.data.market;
    },
    optimisticFn: (currentMarket) => {
      const current = currentMarket || initialMarket;
      const amount = parseEther(betAmount);
      return createOptimisticMarketUpdate(current, outcomeId, amount);
    },
    onSuccess: (data) => {
      setBetAmount('');
      onSuccess?.(txHash);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  const currentMarket = market || initialMarket;
  const currentOutcome = currentMarket.outcomes.find(
    (o) => o.outcomeId === outcomeId
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!betAmount || parseFloat(betAmount) <= 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await execute();
      } catch (err) {
        // Error handled by optimistic update hook
      } finally {
        setIsSubmitting(false);
      }
    },
    [betAmount, execute]
  );

  const potentialWinnings = useCallback(() => {
    if (!betAmount || !currentOutcome) return '0';
    try {
      const amount = parseFloat(betAmount);
      const winnings = amount * currentOutcome.odds;
      return winnings.toFixed(4);
    } catch {
      return '0';
    }
  }, [betAmount, currentOutcome]);

  if (!outcome || !currentOutcome) {
    return <div>Outcome not found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outcome Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {currentOutcome.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Odds:</span>
            <span className="text-2xl font-bold text-blue-600">
              {currentOutcome.odds.toFixed(2)}x
              {isOptimistic && (
                <span className="ml-2 text-xs text-orange-600 animate-pulse">
                  (updating...)
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Total Bets:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatEther(BigInt(currentOutcome.totalBets))} ETH
            </span>
          </div>
        </div>

        {/* Bet Amount Input */}
        <div>
          <label
            htmlFor="betAmount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Bet Amount (ETH)
          </label>
          <input
            id="betAmount"
            type="number"
            step="0.001"
            min="0"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.01"
            disabled={isSubmitting || isUpdating}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            required
          />
        </div>

        {/* Potential Winnings */}
        {betAmount && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Potential Winnings:</span>
              <span className="text-xl font-bold text-green-600">
                {potentialWinnings()} ETH
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {/* Optimistic Update Indicator */}
        {isOptimistic && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-orange-600 animate-spin"
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
              <span className="text-sm text-orange-600">
                Confirming transaction on blockchain...
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !betAmount ||
            parseFloat(betAmount) <= 0 ||
            isSubmitting ||
            isUpdating
          }
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || isUpdating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
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
              {isOptimistic ? 'Confirming...' : 'Placing Bet...'}
            </span>
          ) : (
            'Place Bet'
          )}
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Your bet will be immediately reflected in the UI and confirmed on the
          blockchain
        </p>
      </form>
    </div>
  );
}
