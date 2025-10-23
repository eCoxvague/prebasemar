'use client';

import { useState, useCallback } from 'react';
import { formatEther } from 'viem';
import { useMarketOdds } from '@/lib/hooks/useMarketOdds';
import { usePolling } from '@/lib/hooks/usePolling';
import type { CachedMarket } from '@/lib/kv/types';
import OddsDisplay from '@/components/betting/OddsDisplay';

interface MarketDetailWithPollingProps {
  marketId: string;
  initialMarket: CachedMarket;
  onBetClick?: (outcomeId: number) => void;
  pollingInterval?: number;
}

/**
 * Enhanced market detail component with real-time polling
 * 
 * Features:
 * - Automatic odds updates every 30s
 * - Market data polling
 * - Optimistic UI updates
 * - Manual refresh capability
 */
export default function MarketDetailWithPolling({
  marketId,
  initialMarket,
  onBetClick,
  pollingInterval = 30000,
}: MarketDetailWithPollingProps) {
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);

  // Poll market data
  const {
    data: market,
    isLoading: isLoadingMarket,
    lastUpdate: marketLastUpdate,
    refetch: refetchMarket,
  } = usePolling<CachedMarket>({
    fetchFn: async () => {
      const response = await fetch(`/api/markets/${marketId}`);
      if (!response.ok) throw new Error('Failed to fetch market');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    interval: pollingInterval,
    enabled: true,
    onSuccess: () => {
      setShowRefreshNotification(true);
      setTimeout(() => setShowRefreshNotification(false), 2000);
    },
  });

  // Use market data from polling or initial data
  const currentMarket = market || initialMarket;

  // Poll odds with the hook
  const {
    outcomes,
    isLoading: isLoadingOdds,
    lastUpdate: oddsLastUpdate,
    refresh: refreshOdds,
    isPolling,
  } = useMarketOdds({
    marketId,
    interval: pollingInterval,
    enabled: true,
  });

  const handleManualRefresh = useCallback(async () => {
    await Promise.all([refetchMarket(), refreshOdds()]);
  }, [refetchMarket, refreshOdds]);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-100 text-green-800';
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Closed';
      case 2: return 'Resolved';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const timeRemaining = () => {
    const now = Date.now();
    const end = currentMarket.endTime;
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Refresh Notification */}
      {showRefreshNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Updated</span>
          </div>
        </div>
      )}

      {/* Market Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {currentMarket.title}
              </h1>
              {isPolling && (
                <span className="flex items-center text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-gray-600">{currentMarket.description}</p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isLoadingMarket || isLoadingOdds}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-400"
            title="Refresh data"
            aria-label="Refresh market data"
          >
            <svg
              className={`w-5 h-5 ${isLoadingMarket || isLoadingOdds ? 'animate-spin' : ''}`}
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

        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusColor(currentMarket.status)}`}>
              {getStatusText(currentMarket.status)}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Pool</p>
            <p className="text-lg font-bold text-gray-900">
              {formatEther(BigInt(currentMarket.totalPool))} ETH
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Participants</p>
            <p className="text-lg font-bold text-gray-900">
              {currentMarket.participantCount}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Time Remaining</p>
            <p className="text-lg font-bold text-gray-900">
              {timeRemaining()}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="mt-4">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {currentMarket.category}
          </span>
        </div>
      </div>

      {/* Odds Display with Polling */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <OddsDisplay
          marketId={marketId}
          outcomes={outcomes || currentMarket.outcomes}
          onOutcomeClick={(outcome) => onBetClick?.(outcome.outcomeId)}
          realtime={true}
          refreshInterval={pollingInterval}
        />
      </div>

      {/* Last Update Info */}
      <div className="text-center text-xs text-gray-500">
        {marketLastUpdate && (
          <p>Market data: {marketLastUpdate.toLocaleTimeString()}</p>
        )}
        {oddsLastUpdate && (
          <p>Odds: {oddsLastUpdate.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
}
