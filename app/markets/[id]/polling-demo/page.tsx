/**
 * Demo page showing polling-based real-time updates
 * This demonstrates the implementation of task 8.1
 */

import { Suspense } from 'react';
import MarketDetailWithPolling from '@/components/market/MarketDetailWithPolling';
import { getCachedMarket } from '@/lib/kv';
import { getMarketFromChain, getMarketOutcomes } from '@/lib/blockchain/contract';
import { transformMarketData } from '@/lib/blockchain/marketHelpers';

interface PageProps {
  params: {
    id: string;
  };
}

async function getMarket(marketId: string) {
  // Try cache first
  let market = await getCachedMarket(marketId);

  if (!market) {
    // Fetch from blockchain
    const chainMarket = await getMarketFromChain(BigInt(marketId));
    const outcomes = await getMarketOutcomes(BigInt(marketId));
    market = transformMarketData(chainMarket, outcomes);
  }

  return market;
}

export default async function PollingDemoPage({ params }: PageProps) {
  const market = await getMarket(params.id);

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Market Not Found
          </h2>
          <p className="text-red-600">
            The market with ID {params.id} could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Demo Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">
          📊 Polling Demo - Real-Time Updates
        </h2>
        <p className="text-blue-700 mb-4">
          This page demonstrates the polling-based real-time update system
          implemented for task 8.1. Features include:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>Automatic odds refresh every 30 seconds</li>
          <li>Market data polling with cache-based updates</li>
          <li>Manual refresh capability</li>
          <li>Live indicator showing polling status</li>
          <li>Optimistic UI updates (when betting)</li>
        </ul>
        <div className="mt-4 p-4 bg-white rounded border border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>How it works:</strong> The component automatically fetches
            updated odds and market data from the API every 30 seconds. The API
            uses Vercel KV cache (30s TTL for odds, 5min for market data) to
            minimize blockchain calls while providing near real-time updates.
          </p>
        </div>
      </div>

      {/* Market Detail with Polling */}
      <Suspense
        fallback={
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading market data...</p>
          </div>
        }
      >
        <MarketDetailWithPolling
          marketId={params.id}
          initialMarket={market}
          pollingInterval={30000}
          onBetClick={(outcomeId) => {
            console.log('Bet clicked for outcome:', outcomeId);
            // In a real app, this would open a betting modal
          }}
        />
      </Suspense>

      {/* Technical Details */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          🔧 Technical Implementation
        </h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <strong>Hooks Used:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>
                <code className="bg-gray-200 px-1 rounded">usePolling</code> -
                Generic polling hook
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">useMarketOdds</code>{' '}
                - Specialized odds polling
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  useOptimisticUpdate
                </code>{' '}
                - Optimistic UI updates
              </li>
            </ul>
          </div>
          <div>
            <strong>Cache Strategy:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Odds: 30-second TTL (real-time feel)</li>
              <li>Market data: 5-minute TTL</li>
              <li>User bets: 5-minute TTL</li>
            </ul>
          </div>
          <div>
            <strong>API Endpoints:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  GET /api/odds/[marketId]
                </code>{' '}
                - Fetch odds with cache
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  POST /api/odds/[marketId]/refresh
                </code>{' '}
                - Force refresh
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">
                  GET /api/markets/[id]
                </code>{' '}
                - Fetch market data
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
