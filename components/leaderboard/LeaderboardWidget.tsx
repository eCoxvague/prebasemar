'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatEther } from 'viem';
import type { LeaderboardEntry } from '@/lib/kv/types';

export default function LeaderboardWidget() {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const fetchTopUsers = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=5');
      const data = await response.json();

      if (data.success) {
        setTopUsers(data.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching top users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (topUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🏆 Top Predictors
        </h3>
        <Link
          href="/leaderboard"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {topUsers.map((user, index) => {
          const totalWon = formatEther(BigInt(user.totalWon));
          const profit =
            BigInt(user.totalWon) - BigInt(user.totalWagered);
          const profitFormatted = formatEther(profit);
          const isProfit = profit > 0n;

          return (
            <div
              key={user.fid}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-gray-400 w-6">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </span>

                {user.pfpUrl ? (
                  <Image
                    src={user.pfpUrl}
                    alt={user.displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-semibold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.winRate.toFixed(0)}% win rate
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {parseFloat(totalWon).toFixed(3)} ETH
                </p>
                <p
                  className={`text-xs ${
                    isProfit ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isProfit ? '+' : ''}
                  {parseFloat(profitFormatted).toFixed(3)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
