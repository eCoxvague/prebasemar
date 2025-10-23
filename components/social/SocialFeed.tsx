'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity } from '@/app/api/social/feed/route';

interface SocialFeedProps {
  fid: number;
  limit?: number;
}

export default function SocialFeed({ fid, limit = 25 }: SocialFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, [fid, limit]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/social/feed?fid=${fid}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch social feed');
      }

      const data = await response.json();
      setActivities(data.activities);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'market_created':
        return '🎯';
      case 'bet_placed':
        return '🎲';
      case 'market_resolved':
        return '✅';
      case 'winnings_claimed':
        return '🎉';
      default:
        return '📊';
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'market_created':
        return (
          <>
            created a new market:{' '}
            <Link
              href={`/markets/${activity.market.id}`}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {activity.market.title}
            </Link>
          </>
        );
      case 'bet_placed':
        return (
          <>
            placed a bet of {activity.details?.amount} ETH on{' '}
            <Link
              href={`/markets/${activity.market.id}`}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {activity.market.title}
            </Link>
          </>
        );
      case 'market_resolved':
        return (
          <>
            resolved the market:{' '}
            <Link
              href={`/markets/${activity.market.id}`}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {activity.market.title}
            </Link>
          </>
        );
      case 'winnings_claimed':
        return (
          <>
            won {activity.details?.winnings} ETH from{' '}
            <Link
              href={`/markets/${activity.market.id}`}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              {activity.market.title}
            </Link>
          </>
        );
      default:
        return 'had activity';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-lg p-4 animate-pulse"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        <p className="text-lg mb-2">No recent activity</p>
        <p className="text-sm">
          Follow more users to see their prediction market activities
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <img
              src={activity.user.pfpUrl || '/default-avatar.png'}
              alt={activity.user.displayName}
              className="w-10 h-10 rounded-full"
            />

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <Link
                  href={`https://warpcast.com/${activity.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white hover:text-blue-400"
                >
                  {activity.user.displayName}
                </Link>
                <span className="text-gray-500 text-sm">
                  @{activity.user.username}
                </span>
              </div>

              <p className="text-gray-300 text-sm">
                {getActivityText(activity)}
              </p>

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{formatTimestamp(activity.timestamp)}</span>
                {activity.castHash && (
                  <Link
                    href={`https://warpcast.com/~/conversations/${activity.castHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400"
                  >
                    View on Warpcast →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
