'use client';

import { formatEther } from 'viem';
import type { CachedMarket } from '@/lib/kv/types';

interface MarketCardProps {
  market: CachedMarket;
  onClick: () => void;
  showStats?: boolean;
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

export default function MarketCard({
  market,
  onClick,
  showStats = true,
}: MarketCardProps) {
  const timeRemaining = getTimeRemaining(market.endTime);
  const totalPool = formatEther(BigInt(market.totalPool));

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {market.title}
          </h3>
          {market.category && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {market.category}
            </span>
          )}
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            STATUS_COLORS[market.status] || STATUS_COLORS[0]
          }`}
        >
          {STATUS_LABELS[market.status] || 'Unknown'}
        </span>
      </div>

      {/* Outcomes Preview */}
      <div className="mb-4 space-y-2">
        {market.outcomes.slice(0, 3).map((outcome) => (
          <div
            key={outcome.outcomeId}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700">{outcome.name}</span>
            <span className="font-medium text-blue-600">
              {outcome.odds.toFixed(2)}x
            </span>
          </div>
        ))}
        {market.outcomes.length > 3 && (
          <p className="text-xs text-gray-500">
            +{market.outcomes.length - 3} more outcomes
          </p>
        )}
      </div>

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Pool</p>
            <p className="text-sm font-semibold text-gray-900">
              {parseFloat(totalPool).toFixed(4)} ETH
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Participants</p>
            <p className="text-sm font-semibold text-gray-900">
              {market.participantCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Time Left</p>
            <p className="text-sm font-semibold text-gray-900">
              {timeRemaining}
            </p>
          </div>
        </div>
      )}
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
