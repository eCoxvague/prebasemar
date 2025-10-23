'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface LoginButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function LoginButton({ className = '', variant = 'primary' }: LoginButtonProps) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50',
  };

  async function handleLogin() {
    setLoading(true);

    try {
      // Mock authentication for development
      const mockAuthData = {
        message: 'Sign in to Farcaster Prediction Market',
        signature: '0x' + '0'.repeat(130),
        fid: Math.floor(Math.random() * 10000) + 1,
        username: 'user' + Math.floor(Math.random() * 1000),
        displayName: 'User ' + Math.floor(Math.random() * 1000),
        pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        bio: 'Farcaster user',
      };

      await login(mockAuthData);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {loading ? 'Connecting...' : 'Sign in'}
    </button>
  );
}
