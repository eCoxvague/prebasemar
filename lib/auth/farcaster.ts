import { createAppClient, viemConnector } from '@farcaster/auth-kit';

/**
 * Farcaster authentication configuration
 */
export const farcasterConfig = {
  relay: 'https://relay.farcaster.xyz',
  rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  domain: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  siweUri: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

/**
 * Farcaster user data from authentication
 */
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  custody?: string;
  verifications?: string[];
}

/**
 * Farcaster authentication response
 */
export interface FarcasterAuthResponse {
  message: string;
  signature: string;
  fid: number;
  username: string;
  bio: string;
  displayName: string;
  pfpUrl: string;
  custody?: string;
  verifications?: string[];
}

/**
 * Verify Farcaster signature
 * @param message - The message that was signed
 * @param signature - The signature to verify
 * @param fid - Farcaster ID
 * @returns true if signature is valid
 */
export async function verifyFarcasterSignature(
  message: string,
  signature: string,
  fid: number
): Promise<boolean> {
  try {
    // In production, verify the signature against Farcaster's custody address
    // For now, we'll do basic validation
    if (!message || !signature || !fid) {
      return false;
    }

    // TODO: Implement proper signature verification using Farcaster Hub API
    // This should verify that the signature was created by the custody address
    // associated with the given FID

    return true;
  } catch (error) {
    console.error('Error verifying Farcaster signature:', error);
    return false;
  }
}

/**
 * Create authentication message for signing
 * @param fid - Farcaster ID
 * @returns Message to be signed
 */
export function createAuthMessage(fid: number): string {
  const timestamp = Date.now();
  const domain = farcasterConfig.domain;
  return `${domain} wants you to sign in with your Farcaster account:\n\nFID: ${fid}\nTimestamp: ${timestamp}\n\nSign in to Farcaster Prediction Market`;
}

/**
 * Parse Farcaster user data from auth response
 * @param authData - Authentication response data
 * @returns Parsed Farcaster user
 */
export function parseFarcasterUser(
  authData: FarcasterAuthResponse
): FarcasterUser {
  return {
    fid: authData.fid,
    username: authData.username,
    displayName: authData.displayName,
    pfpUrl: authData.pfpUrl,
    bio: authData.bio,
    custody: authData.custody,
    verifications: authData.verifications,
  };
}
