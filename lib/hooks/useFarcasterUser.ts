'use client';

import { useState, useEffect } from 'react';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
}

/**
 * Hook to fetch Farcaster user profile
 * @param fid - Farcaster ID
 * @returns User profile data, loading state, and error
 */
export function useFarcasterUser(fid: number | null) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fid) {
      setUser(null);
      return;
    }

    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${fid}/profile`);

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [fid]);

  return { user, loading, error };
}

/**
 * Hook to fetch multiple Farcaster user profiles
 * @param fids - Array of Farcaster IDs
 * @returns User profiles, loading state, and error
 */
export function useFarcasterUsers(fids: number[]) {
  const [users, setUsers] = useState<FarcasterUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fids.length === 0) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);

      try {
        const fidsParam = fids.join(',');
        const response = await fetch(`/api/users/bulk?fids=${fidsParam}`);

        if (!response.ok) {
          throw new Error('Failed to fetch user profiles');
        }

        const data = await response.json();

        if (!cancelled) {
          setUsers(data.users);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [fids.join(',')]);

  return { users, loading, error };
}
