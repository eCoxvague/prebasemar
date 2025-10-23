'use client';

import { useState } from 'react';
import { formatEther } from 'viem';
import { useMarket } from '@/lib/hooks/useMarkets';
import type { CachedMarket } from '@/lib/kv/types';

interface MarketDetailProps {
  marketId: string;
  userAddress?: string;
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
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-red-100 text-red-800',
  4: 'bg-yellow-100 text-yellow-800',
};

export default function MarketDetail({
  marketId,
  userAddress,
}: MarketDetailProps) {
  const { data, isLoading, error } = useMarket(marketId);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading market...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Failed to load market. Please try again.</p>
      </div>
    );
  }

  const market = data.data;
  const totalPool = formatEther(BigInt(market.totalPool));
  const timeRemaining = getTimeRemaining(market.endTime);
  const isActive = market.status === 0 && market.endTime > Date.now() / 1000;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {market.title}
            </h1>
            {market.category && (
              <span className="inline-block px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded">
                {market.category}
              </span>
            )}
          </div>
          <span
            className={`px-4 py-2 text-sm font-medium rounded-full ${
              STATUS_COLORS[market.status] || STATUS_COLORS[0]
            }`}
          >
            {STATUS_LABELS[market.status] || 'Unknown'}
          </span>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Pool</p>
            <p className="text-2xl font-bold text-gray-900">
              {parseFloat(totalPool).toFixed(4)} ETH
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Participants</p>
            <p className="text-2xl font-bold text-gray-900">
              {market.participantCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
            <p className="text-2xl font-bold text-gray-900">{timeRemaining}</p>
          </div>
        </div>

        {/* Countdown Timer */}
        {isActive && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Market closes on{' '}
              {new Date(market.endTime * 1000).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Outcomes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Outcomes</h2>
        <div className="space-y-3">
          {market.outcomes.map((outcome) => {
            const outcomeBets = formatEther(BigInt(outcome.totalBets));
            const percentage =
              market.totalPool !== '0'
                ? (
                    (Number(outcome.totalBets) / Number(market.totalPool)) *
                    100
                  ).toFixed(1)
                : '0';

            return (
              <div
                key={outcome.outcomeId}
                onClick={() =>
                  isActive && setSelectedOutcome(outcome.outcomeId)
                }
                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                  selectedOutcome === outcome.outcomeId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!isActive && 'opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {outcome.name}
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {outcome.odds.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{parseFloat(outcomeBets).toFixed(4)} ETH</span>
                  <span>{percentage}% of pool</span>
                </div>
                {/* Progress Bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bet Button */}
        {isActive && selectedOutcome !== null && (
          <div className="mt-6">
            <button
              onClick={() => {
                // This will be implemented in task 7 (Betting system)
                alert('Betting functionality will be implemented in task 7');
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Place Bet on {market.outcomes[selectedOutcome]?.name}
            </button>
          </div>
        )}

        {!isActive && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">
              This market is no longer accepting bets
            </p>
          </div>
        )}
      </div>

      {/* Market Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Market Information
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Market ID</span>
            <span className="font-medium text-gray-900">{market.marketId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Creator</span>
            <span className="font-mono text-gray-900">
              {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created</span>
            <span className="text-gray-900">
              {new Date(market.cachedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ends</span>
            <span className="text-gray-900">
              {new Date(market.endTime * 1000).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bet History Placeholder */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bets</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Bet history will be displayed here</p>
          <p className="text-sm mt-2">
            (Will be implemented with betting functionality)
          </p>
        </div>
      </div>
    </div>
  );
}

function getTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;

  if (remaining <= 0) {
    return 'Ended';
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
