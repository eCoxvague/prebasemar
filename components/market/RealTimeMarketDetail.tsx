'use client';

import { useEffect, useState } from 'react';
import {
  useMarketUpdates,
  useOddsUpdates,
  useBetPlaced,
  useMarketResolution,
} from '@/lib/websocket';

interface RealTimeMarketDetailProps {
  marketId: string;
  initialOdds: number[];
  initialTotalPool: string;
  initialParticipantCount: number;
}

/**
 * Example component demonstrating real-time WebSocket updates
 * This component subscribes to market updates, odds changes, and bet events
 */
export function RealTimeMarketDetail({
  marketId,
  initialOdds,
  initialTotalPool,
  initialParticipantCount,
}: RealTimeMarketDetailProps) {
  const [odds, setOdds] = useState<number[]>(initialOdds);
  const [totalPool, setTotalPool] = useState<string>(initialTotalPool);
  const [participantCount, setParticipantCount] = useState<number>(
    initialParticipantCount
  );
  const [recentBets, setRecentBets] = useState<string[]>([]);
  const [isResolved, setIsResolved] = useState(false);
  const [winningOutcome, setWinningOutcome] = useState<number | null>(null);

  // Subscribe to market updates
  const marketData = useMarketUpdates(marketId);

  // Subscribe to odds updates with callback
  const latestOdds = useOddsUpdates(marketId, (payload) => {
    console.log('[RealTime] Odds updated:', payload);
    setOdds(payload.odds);
    setTotalPool(payload.totalPool);
  });

  // Subscribe to bet placed events
  const lastBet = useBetPlaced(marketId, (payload) => {
    console.log('[RealTime] New bet placed:', payload);
    setRecentBets((prev) => [
      `${payload.bettor.slice(0, 6)}... bet ${payload.amount} ETH on outcome ${payload.outcomeId}`,
      ...prev.slice(0, 4), // Keep last 5 bets
    ]);
  });

  // Subscribe to market resolution
  const resolution = useMarketResolution(marketId, (payload) => {
    console.log('[RealTime] Market resolved:', payload);
    setIsResolved(true);
    setWinningOutcome(payload.winningOutcome);
  });

  // Update state when market data changes
  useEffect(() => {
    if (marketData) {
      setTotalPool(marketData.totalPool);
      setParticipantCount(marketData.participantCount);
    }
  }, [marketData]);

  // Update odds when they change
  useEffect(() => {
    if (latestOdds) {
      setOdds(latestOdds);
    }
  }, [latestOdds]);

  return (
    <div className="space-y-6">
      {/* Market Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Market Details</h2>
        
        {isResolved && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Market Resolved!</strong> Winning outcome: {winningOutcome}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Total Pool</p>
            <p className="text-2xl font-bold">{totalPool} ETH</p>
          </div>
          <div>
            <p className="text-gray-600">Participants</p>
            <p className="text-2xl font-bold">{participantCount}</p>
          </div>
        </div>
      </div>

      {/* Real-time Odds */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">
          Live Odds
          <span className="ml-2 inline-flex items-center">
            <span className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></span>
            <span className="ml-2 text-sm text-gray-600">Live</span>
          </span>
        </h3>
        
        <div className="space-y-3">
          {odds.map((odd, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <span className="font-medium">Outcome {index + 1}</span>
              <span className="text-xl font-bold text-blue-600">
                {odd.toFixed(2)}x
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Bets Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Recent Bets</h3>
        
        {recentBets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No bets yet. Be the first to bet!
          </p>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded text-sm animate-fade-in"
              >
                {bet}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="text-center text-sm text-gray-500">
        <span className="inline-flex items-center">
          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
          Connected to real-time updates
        </span>
      </div>
    </div>
  );
}
