'use client';

import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import type { CachedMarket, CachedOutcome } from '@/lib/kv/types';

interface BetModalProps {
  market: CachedMarket;
  outcome: CachedOutcome;
  onConfirm: (amount: bigint) => Promise<void>;
  onClose: () => void;
  userBalance?: bigint;
}

export default function BetModal({
  market,
  outcome,
  onConfirm,
  onClose,
  userBalance,
}: BetModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [odds, setOdds] = useState<number>(outcome.odds);
  const [potentialWinnings, setPotentialWinnings] = useState<string>('0');
  const [slippage, setSlippage] = useState<number>(0);

  // Auto-refresh odds every 5 seconds
  useEffect(() => {
    const fetchOdds = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setOdds(outcome.odds);
        setPotentialWinnings('0');
        setSlippage(0);
        return;
      }

      try {
        const betAmount = parseEther(amount);
        const response = await fetch(
          `/api/odds/${market.marketId}?betAmount=${betAmount.toString()}&outcomeId=${outcome.outcomeId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOdds(data.data.odds[outcome.outcomeId]);
            setPotentialWinnings(formatEther(BigInt(data.data.potentialWinnings)));
            setSlippage(data.data.slippage || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching odds:', err);
      }
    };

    fetchOdds();
    const interval = setInterval(fetchOdds, 5000);

    return () => clearInterval(interval);
  }, [amount, market.marketId, outcome.outcomeId, outcome.odds]);

  const handleAmountChange = (value: string) => {
    // Only allow valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    if (userBalance) {
      setAmount(formatEther(userBalance));
    }
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      
      // Validation
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const betAmount = parseEther(amount);

      if (userBalance && betAmount > userBalance) {
        setError('Insufficient balance');
        return;
      }

      setIsLoading(true);
      await onConfirm(betAmount);
      
      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Place Bet</h2>
            <p className="text-sm text-gray-600 mt-1">{market.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Selected Outcome */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Betting on</p>
          <p className="text-lg font-semibold text-gray-900">{outcome.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Current Odds</span>
            <span className="text-lg font-bold text-blue-600">
              {odds.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (ETH)
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {userBalance && (
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                disabled={isLoading}
              >
                MAX
              </button>
            )}
          </div>
          {userBalance && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: {formatEther(userBalance)} ETH
            </p>
          )}
        </div>

        {/* Potential Winnings */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Potential Winnings</span>
              <span className="text-lg font-bold text-green-600">
                {parseFloat(potentialWinnings).toFixed(4)} ETH
              </span>
            </div>
            {slippage > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Slippage</span>
                <span className="text-xs text-gray-700">
                  {slippage.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
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
                Processing...
              </span>
            ) : (
              'Confirm Bet'
            )}
          </button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Transaction will be sent to your wallet for confirmation
        </p>
      </div>
    </div>
  );
}
