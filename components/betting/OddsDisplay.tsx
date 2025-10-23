'use client';

import { useEffect } from 'react';
import { formatEther } from 'viem';
import type { CachedOutcome } from '@/lib/kv/types';
import { useMarketOdds, useRefreshOdds } from '@/lib/hooks/useMarketOdds';

interface OddsDisplayProps {
  marketId: string;
  outcomes: CachedOutcome[];
  onOutcomeClick?: (outcome: CachedOutcome) => void;
  realtime?: boolean;
  refreshInterval?: number; // in milliseconds
}

export default function OddsDisplay({
  marketId,
  outcomes: initialOutcomes,
  onOutcomeClick,
  realtime = false,
  refreshInterval = 30000, // 30 seconds default
}: OddsDisplayProps) {
  // Use the polling hook for automatic updates
  const {
    outcomes: polledOutcomes,
    isLoading: isRefreshing,
    lastUpdate,
    refresh,
    isPolling,
  } = useMarketOdds({
    marketId,
    interval: refreshInterval,
    enabled: realtime,
  });

  // Use manual refresh hook
  const { refresh: forceRefresh } = useRefreshOdds(marketId);

  // Use polled outcomes if available, otherwise use initial outcomes
  const outcomes = polledOutcomes || initialOutcomes;

  const handleManualRefresh = async () => {
    try {
      await forceRefresh();
      // Refresh the polled data after force refresh
      await refresh();
    } catch (error) {
      console.error('Error refreshing odds:', error);
    }
  };

  const getOddsChangeColor = (odds: number) => {
    // Color coding based on odds value
    if (odds < 2) return 'text-red-600';
    if (odds < 3) return 'text-orange-600';
    if (odds < 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBarWidth = (totalBets: string, maxBets: string) => {
    const bets = BigInt(totalBets);
    const max = BigInt(maxBets);
    if (max === 0n) return 0;
    return Number((bets * 100n) / max);
  };

  const maxBets = outcomes.reduce(
    (max, outcome) => {
      const bets = BigInt(outcome.totalBets);
      return bets > max ? bets : max;
    },
    0n
  ).toString();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Outcomes & Odds</h3>
        <div className="flex items-center gap-2">
          {realtime && isPolling && (
            <span className="flex items-center text-xs text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
              Live
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
            title="Refresh odds"
            aria-label="Refresh odds"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
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
      </div>

      {/* Outcomes List */}
      <div className="space-y-3">
        {outcomes.map((outcome) => {
          const barWidth = getBarWidth(outcome.totalBets, maxBets);
          const isClickable = !!onOutcomeClick;

          return (
            <div
              key={outcome.outcomeId}
              onClick={() => isClickable && onOutcomeClick(outcome)}
              className={`relative bg-white border border-gray-200 rounded-lg p-4 transition-all ${
                isClickable
                  ? 'cursor-pointer hover:border-blue-500 hover:shadow-md'
                  : ''
              }`}
            >
              {/* Background bar showing relative bet volume */}
              <div
                className="absolute inset-0 bg-blue-50 rounded-lg transition-all"
                style={{ width: `${barWidth}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    {outcome.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatEther(BigInt(outcome.totalBets))} ETH bet
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${getOddsChangeColor(
                      outcome.odds
                    )}`}
                  >
                    {outcome.odds.toFixed(2)}x
                  </p>
                  {isClickable && (
                    <p className="text-xs text-blue-600 mt-1">Click to bet</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
