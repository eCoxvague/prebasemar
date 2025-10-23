'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  walletAddress?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (authData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateWallet: (address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      // Try to get FID from localStorage
      const storedFid = localStorage.getItem('farcaster_fid');
      if (!storedFid) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/auth/session?fid=${storedFid}`);
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('farcaster_fid');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(authData: any) {
    try {
      const response = await fetch('/api/auth/farcaster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('farcaster_fid', data.user.fid.toString());
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (user) {
        await fetch(`/api/auth/session?fid=${user.fid}`, {
          method: 'DELETE',
        });
      }

      setUser(null);
      localStorage.removeItem('farcaster_fid');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function updateWallet(address: string) {
    if (user) {
      setUser({ ...user, walletAddress: address });
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
