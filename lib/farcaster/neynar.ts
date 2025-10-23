import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Initialize Neynar client
let neynarClient: NeynarAPIClient | null = null;

export function getNeynarClient(): NeynarAPIClient {
  if (!neynarClient) {
    const apiKey = process.env.NEYNAR_API_KEY;
    
    if (!apiKey) {
      throw new Error('NEYNAR_API_KEY is not configured');
    }
    
    neynarClient = new NeynarAPIClient({ apiKey });
  }
  
  return neynarClient;
}

// Types for cast publishing
export interface PublishCastParams {
  text: string;
  embeds?: Array<{
    url: string;
  }>;
  channelId?: string;
  parent?: string;
  signerUuid: string;
}

export interface CastResponse {
  success: boolean;
  cast?: {
    hash: string;
    author: {
      fid: number;
      username: string;
    };
    text: string;
    timestamp: string;
  };
  error?: string;
}

/**
 * Publish a cast to Farcaster
 */
export async function publishCast(params: PublishCastParams): Promise<CastResponse> {
  try {
    const client = getNeynarClient();
    
    const result = await client.publishCast({
      signerUuid: params.signerUuid,
      text: params.text,
      embeds: params.embeds,
      channelId: params.channelId,
      parent: params.parent,
    });
    
    return {
      success: true,
      cast: {
        hash: result.cast.hash,
        author: {
          fid: result.cast.author.fid,
          username: (result.cast.author as any).username || '',
        },
        text: result.cast.text,
        timestamp: (result.cast as any).timestamp || new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Failed to publish cast:', error);
    return {
      success: false,
      error: error.message || 'Failed to publish cast',
    };
  }
}

/**
 * Get user's casts
 */
export async function getUserCasts(fid: number, limit: number = 25) {
  try {
    const client = getNeynarClient();
    const result = await client.fetchCastsForUser({ fid, limit });
    return result.casts;
  } catch (error: any) {
    console.error('Failed to fetch user casts:', error);
    throw new Error(error.message || 'Failed to fetch user casts');
  }
}

/**
 * Get cast by hash
 */
export async function getCastByHash(hash: string) {
  try {
    const client = getNeynarClient();
    const result = await client.lookupCastByHashOrUrl({ identifier: hash, type: 'hash' });
    return result.cast;
  } catch (error: any) {
    console.error('Failed to fetch cast:', error);
    throw new Error(error.message || 'Failed to fetch cast');
  }
}
