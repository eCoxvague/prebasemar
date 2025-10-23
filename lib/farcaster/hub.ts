/**
 * Farcaster Hub API client for fetching user data
 */

const FARCASTER_HUB_URL =
  process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

/**
 * Farcaster user profile data
 */
export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  verifications?: string[];
}

/**
 * Fetch user profile from Farcaster Hub via Neynar API
 * @param fid - Farcaster ID
 * @returns User profile data
 */
export async function fetchFarcasterProfile(
  fid: number
): Promise<FarcasterProfile | null> {
  try {
    if (!NEYNAR_API_KEY) {
      console.warn('NEYNAR_API_KEY not configured, using mock data');
      return getMockProfile(fid);
    }

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) {
      return null;
    }

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || '',
      bio: user.profile?.bio?.text || '',
      followerCount: user.follower_count,
      followingCount: user.following_count,
      verifications: user.verifications || [],
    };
  } catch (error) {
    console.error('Error fetching Farcaster profile:', error);
    return null;
  }
}

/**
 * Fetch multiple user profiles at once
 * @param fids - Array of Farcaster IDs
 * @returns Array of user profiles
 */
export async function fetchFarcasterProfiles(
  fids: number[]
): Promise<FarcasterProfile[]> {
  try {
    if (!NEYNAR_API_KEY) {
      console.warn('NEYNAR_API_KEY not configured, using mock data');
      return fids.map((fid) => getMockProfile(fid)).filter(Boolean) as FarcasterProfile[];
    }

    const fidsParam = fids.join(',');
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsParam}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();

    return (
      data.users?.map((user: any) => ({
        fid: user.fid,
        username: user.username,
        displayName: user.display_name || user.username,
        pfpUrl: user.pfp_url || '',
        bio: user.profile?.bio?.text || '',
        followerCount: user.follower_count,
        followingCount: user.following_count,
        verifications: user.verifications || [],
      })) || []
    );
  } catch (error) {
    console.error('Error fetching Farcaster profiles:', error);
    return [];
  }
}

/**
 * Mock profile for development/testing
 */
function getMockProfile(fid: number): FarcasterProfile {
  return {
    fid,
    username: `user${fid}`,
    displayName: `User ${fid}`,
    pfpUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`,
    bio: 'Farcaster user',
    followerCount: 0,
    followingCount: 0,
    verifications: [],
  };
}

/**
 * Verify if a user exists on Farcaster
 * @param fid - Farcaster ID
 * @returns true if user exists
 */
export async function verifyFarcasterUser(fid: number): Promise<boolean> {
  const profile = await fetchFarcasterProfile(fid);
  return profile !== null;
}
