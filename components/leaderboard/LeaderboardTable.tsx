'use client';

import { formatEther } from 'viem';
import Image from 'next/image';
import type { LeaderboardEntry } from '@/lib/kv/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserFid?: number;
  isLoading?: boolean;
}

export default function LeaderboardTable({
  entries,
  currentUserFid,
  isLoading = false,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No leaderboard data yet. Be the first to place a bet!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Wagered
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Won
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bets
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Win Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => {
            const isCurrentUser = currentUserFid === entry.fid;
            const totalWagered = formatEther(BigInt(entry.totalWagered));
            const totalWon = formatEther(BigInt(entry.totalWon));
            const profit = BigInt(entry.totalWon) - BigInt(entry.totalWagered);
            const profitFormatted = formatEther(profit);
            const isProfit = profit > 0n;

            return (
              <tr
                key={entry.fid}
                className={`${
                  isCurrentUser ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-900">
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {entry.pfpUrl ? (
                      <Image
                        src={entry.pfpUrl}
                        alt={entry.displayName}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.displayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-600">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{entry.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {parseFloat(totalWagered).toFixed(4)} ETH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {parseFloat(totalWon).toFixed(4)} ETH
                  </div>
                  <div
                    className={`text-xs ${
                      isProfit ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isProfit ? '+' : ''}
                    {parseFloat(profitFormatted).toFixed(4)} ETH
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{entry.totalBets}</div>
                  <div className="text-xs text-gray-500">
                    {entry.wonBets} won
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.winRate >= 60
                        ? 'bg-green-100 text-green-800'
                        : entry.winRate >= 40
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entry.winRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
