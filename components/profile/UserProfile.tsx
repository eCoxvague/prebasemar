'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';

interface UserProfileData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
}

interface UserStatistics {
  totalBets: number;
  totalWagered: string;
  totalClaimable: string;
}

interface UserProfileProps {
  fid: number;
  walletAddress?: string;
  isOwnProfile?: boolean;
}

export default function UserProfile({
  fid,
  walletAddress,
  isOwnProfile = false,
}: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build URL with optional wallet address for statistics
        const url = walletAddress
          ? `/api/users/${fid}/profile?walletAddress=${walletAddress}`
          : `/api/users/${fid}/profile`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();

        setProfile(data.user);
        if (data.statistics) {
          setStatistics(data.statistics);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [fid, walletAddress]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-32"></div>
      
      <div className="px-6 pb-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start -mt-16 mb-6">
          <img
            src={profile.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`}
            alt={profile.displayName}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />
          <div className="ml-6 mt-20">
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.displayName}
            </h1>
            <p className="text-gray-600">@{profile.username}</p>
            <p className="text-sm text-gray-500 mt-1">FID: {profile.fid}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Bets</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalBets}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Wagered</p>
              <p className="text-2xl font-bold text-gray-900">
                {parseFloat(formatEther(BigInt(statistics.totalWagered))).toFixed(4)} ETH
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Claimable Winnings</p>
              <p className="text-2xl font-bold text-green-600">
                {parseFloat(formatEther(BigInt(statistics.totalClaimable))).toFixed(4)} ETH
              </p>
            </div>
          </div>
        )}

        {/* Connect Wallet Message */}
        {!walletAddress && isOwnProfile && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Connect your wallet to view detailed statistics and manage your bets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
