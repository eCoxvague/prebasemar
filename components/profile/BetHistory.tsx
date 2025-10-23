'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import Link from 'next/link';

interface Market {
  marketId: string;
  title: string;
  status: number;
  endTime: number;
  outcomes: Array<{
    outcomeId: number;
    name: string;
    odds: number;
  }>;
}

interface Bet {
  marketId: string;
  outcomeId: number;
  amount: string;
  timestamp: number;
  market: Market;
  claimableWinnings?: string;
}

interface BetHistoryProps {
  fid: number;
  walletAddress: string;
  filter?: 'active' | 'resolved' | 'all';
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Active',
  1: 'Closed',
  2: 'Resolved',
  3: 'Cancelled',
  4: 'Disputed',
};

const STATUS_COLORS: Record<number, string> = {
  0: 'bg-green-100 text-green-800',
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-gray-100 text-gray-800',
  4: 'bg-red-100 text-red-800',
};

export default function BetHistory({
  fid,
  walletAddress,
  filter = 'all',
}: BetHistoryProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(filter);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/users/${fid}/bets?walletAddress=${walletAddress}&status=${activeFilter}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch bets');
        }

        const data = await response.json();

        if (data.success) {
          setBets(data.data.bets);
        } else {
          throw new Error(data.error || 'Failed to fetch bets');
        }
      } catch (err) {
        console.error('Error fetching bets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bets');
      } finally {
        setIsLoading(false);
      }
    };

    if (walletAddress) {
      fetchBets();
    }
  }, [fid, walletAddress, activeFilter]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading bets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bet History</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'resolved'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Bets List */}
      {bets.length > 0 ? (
        <div className="space-y-4">
          {bets.map((bet, index) => {
            const outcome = bet.market.outcomes.find(
              (o) => o.outcomeId === bet.outcomeId
            );
            const amountEth = formatEther(BigInt(bet.amount));
            const hasWinnings = bet.claimableWinnings && BigInt(bet.claimableWinnings) > 0n;

            return (
              <div
                key={`${bet.marketId}-${index}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      href={`/markets/${bet.marketId}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {bet.market.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          STATUS_COLORS[bet.market.status]
                        }`}
                      >
                        {STATUS_LABELS[bet.market.status]}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(bet.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {parseFloat(amountEth).toFixed(4)} ETH
                    </p>
                    {hasWinnings && (
                      <p className="text-sm text-green-600 font-medium">
                        +{parseFloat(formatEther(BigInt(bet.claimableWinnings!))).toFixed(4)} ETH
                      </p>
                    )}
                  </div>
                </div>

                {/* Bet Details */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Your Prediction:</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {outcome?.name || `Outcome ${bet.outcomeId}`}
                    </p>
                    {outcome && (
                      <p className="text-sm text-gray-600">
                        Odds: {outcome.odds.toFixed(2)}x
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {bet.market.status === 0 && (
                  <Link
                    href={`/markets/${bet.marketId}`}
                    className="mt-3 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Market
                  </Link>
                )}
                {hasWinnings && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 text-center">
                      You won! Claim your winnings from the Winnings section
                    </p>
                  </div>
                )}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-600 font-medium">No bets found</p>
          <p className="text-sm text-gray-500 mt-2">
            {activeFilter === 'active'
              ? 'You have no active bets'
              : activeFilter === 'resolved'
              ? 'You have no resolved bets'
              : 'Start betting on markets to see your history here'}
          </p>
        </div>
      )}
    </div>
  );
}
