'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface FarcasterAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function FarcasterAuth({ onSuccess, onError }: FarcasterAuthProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAuth() {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would use @farcaster/auth-kit
      // For now, we'll create a mock authentication flow
      
      // TODO: Integrate with Farcaster Auth Kit
      // const authKit = new AuthKit({...});
      // const result = await authKit.signIn();
      
      // Mock authentication data for development
      const mockAuthData = {
        message: 'Sign in to Farcaster Prediction Market',
        signature: '0x' + '0'.repeat(130), // Mock signature
        fid: Math.floor(Math.random() * 10000) + 1,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        bio: 'Test user for development',
      };

      await login(mockAuthData);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleAuth}
        disabled={loading}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Connecting...' : 'Sign in with Farcaster'}
      </button>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500 text-center max-w-md">
        Connect your Farcaster account to create markets, place bets, and claim winnings.
      </p>
    </div>
  );
}
