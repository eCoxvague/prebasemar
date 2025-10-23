/**
 * Deep link generation utilities for Farcaster
 */

/**
 * Generate a deep link to a market page
 */
export function generateMarketDeepLink(marketId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/markets/${marketId}`;
}

/**
 * Generate a deep link to place a bet on a specific outcome
 */
export function generateBetDeepLink(marketId: string, outcomeId: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/markets/${marketId}?outcome=${outcomeId}`;
}

/**
 * Generate a deep link to user profile
 */
export function generateProfileDeepLink(fid: number): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/profile/${fid}`;
}

/**
 * Generate a deep link to leaderboard
 */
export function generateLeaderboardDeepLink(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/leaderboard`;
}

/**
 * Generate a Warpcast composer link with pre-filled text
 */
export function generateWarpcastComposerLink(
  text: string,
  embeds?: string[]
): string {
  const encodedText = encodeURIComponent(text);
  let url = `https://warpcast.com/~/compose?text=${encodedText}`;
  
  if (embeds && embeds.length > 0) {
    const embedsParam = embeds.map(e => encodeURIComponent(e)).join(',');
    url += `&embeds[]=${embedsParam}`;
  }
  
  return url;
}

/**
 * Generate a shareable market link for Warpcast
 */
export function generateShareableMarketLink(
  marketId: string,
  marketTitle: string
): string {
  const marketUrl = generateMarketDeepLink(marketId);
  const text = `🎯 Check out this prediction market: ${marketTitle}`;
  return generateWarpcastComposerLink(text, [marketUrl]);
}

/**
 * Generate a shareable bet link for Warpcast
 */
export function generateShareableBetLink(
  marketId: string,
  marketTitle: string,
  outcomeName: string,
  amount: string
): string {
  const marketUrl = generateMarketDeepLink(marketId);
  const amountInEth = (parseFloat(amount) / 1e18).toFixed(4);
  const text = `🎲 I just bet ${amountInEth} ETH on "${outcomeName}" in: ${marketTitle}`;
  return generateWarpcastComposerLink(text, [marketUrl]);
}

/**
 * Generate a shareable win link for Warpcast
 */
export function generateShareableWinLink(
  marketId: string,
  marketTitle: string,
  winnings: string
): string {
  const marketUrl = generateMarketDeepLink(marketId);
  const winningsInEth = (parseFloat(winnings) / 1e18).toFixed(4);
  const text = `🎉 I won ${winningsInEth} ETH from: ${marketTitle}`;
  return generateWarpcastComposerLink(text, [marketUrl]);
}

/**
 * Parse deep link parameters from URL
 */
export function parseDeepLinkParams(url: string): {
  marketId?: string;
  outcomeId?: number;
  fid?: number;
} {
  try {
    const urlObj = new URL(url);
    const params: any = {};
    
    // Extract market ID from path
    const marketMatch = urlObj.pathname.match(/\/markets\/([^/]+)/);
    if (marketMatch) {
      params.marketId = marketMatch[1];
    }
    
    // Extract outcome ID from query params
    const outcomeId = urlObj.searchParams.get('outcome');
    if (outcomeId) {
      params.outcomeId = parseInt(outcomeId);
    }
    
    // Extract FID from path
    const fidMatch = urlObj.pathname.match(/\/profile\/(\d+)/);
    if (fidMatch) {
      params.fid = parseInt(fidMatch[1]);
    }
    
    return params;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return {};
  }
}
