'use client';

import { useState, useEffect } from 'react';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import type { LeaderboardEntry } from '@/lib/kv/types';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For MVP, we don't have FID mapping yet
      // In production, you'd get FID from user session
      const fid: number | undefined = undefined;

      const url = new URL('/api/leaderboard', window.location.origin);
      url.searchParams.set('limit', String(limit));
      
      if (fid !== undefined) {
        url.searchParams.set('fid', String(fid));
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      setLeaderboard(data.data.leaderboard);
      setUserRank(data.data.userRank);
      setUserEntry(data.data.userEntry);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Top predictors ranked by total winnings
          </p>
        </div>

        {/* User Rank Card (if logged in and has rank) */}
        {userEntry && userRank && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Your Rank</p>
                <p className="text-4xl font-bold">#{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Win Rate</p>
                <p className="text-2xl font-bold">{userEntry.winRate.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Won</p>
                <p className="text-2xl font-bold">
                  {(parseFloat(userEntry.totalWon) / 1e18).toFixed(4)} ETH
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Show top:
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <LeaderboardTable
            entries={leaderboard}
            currentUserFid={userEntry?.fid}
            isLoading={isLoading}
          />
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How Rankings Work
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Rankings are based on total winnings (Total Won - Total Wagered)
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Win rate is calculated from resolved markets only
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Leaderboard updates every 10 minutes
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Only users with at least one bet are shown
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
