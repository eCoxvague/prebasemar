/**
 * Farcaster Frames utilities
 * Generates Frame metadata and handles Frame interactions
 */

export interface FrameMetadata {
  version: string;
  image: string;
  imageAspectRatio?: '1.91:1' | '1:1';
  buttons?: FrameButton[];
  postUrl?: string;
  input?: {
    text: string;
  };
}

export interface FrameButton {
  index: number;
  label: string;
  action: 'post' | 'post_redirect' | 'link' | 'mint';
  target?: string;
}

/**
 * Generate Frame metadata tags for HTML head
 */
export function generateFrameMetadata(metadata: FrameMetadata): Record<string, string> {
  const tags: Record<string, string> = {
    'fc:frame': metadata.version,
    'fc:frame:image': metadata.image,
  };

  if (metadata.imageAspectRatio) {
    tags['fc:frame:image:aspect_ratio'] = metadata.imageAspectRatio;
  }

  if (metadata.postUrl) {
    tags['fc:frame:post_url'] = metadata.postUrl;
  }

  if (metadata.input) {
    tags['fc:frame:input:text'] = metadata.input.text;
  }

  if (metadata.buttons) {
    metadata.buttons.forEach((button) => {
      const prefix = `fc:frame:button:${button.index}`;
      tags[prefix] = button.label;
      tags[`${prefix}:action`] = button.action;
      if (button.target) {
        tags[`${prefix}:target`] = button.target;
      }
    });
  }

  return tags;
}

/**
 * Generate OG image URL for a market
 */
export function generateMarketImageUrl(marketId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/api/og/market/${marketId}`;
}

/**
 * Generate Frame metadata for a market
 */
export function generateMarketFrame(marketId: string, title: string): FrameMetadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    version: 'vNext',
    image: generateMarketImageUrl(marketId),
    imageAspectRatio: '1.91:1',
    buttons: [
      {
        index: 1,
        label: 'View Market',
        action: 'link',
        target: `${appUrl}/markets/${marketId}`,
      },
      {
        index: 2,
        label: 'Place Bet',
        action: 'link',
        target: `${appUrl}/markets/${marketId}`,
      },
      {
        index: 3,
        label: 'Share',
        action: 'link',
        target: `${appUrl}/markets/${marketId}`,
      },
    ],
    postUrl: `${appUrl}/api/frames/market/${marketId}`,
  };
}

/**
 * Generate Frame metadata for bet confirmation
 */
export function generateBetFrame(
  marketId: string,
  outcomeId: number,
  amount: string
): FrameMetadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    version: 'vNext',
    image: `${appUrl}/api/og/bet/${marketId}/${outcomeId}/${amount}`,
    imageAspectRatio: '1.91:1',
    buttons: [
      {
        index: 1,
        label: 'View Market',
        action: 'link',
        target: `${appUrl}/markets/${marketId}`,
      },
      {
        index: 2,
        label: 'My Bets',
        action: 'link',
        target: `${appUrl}/profile`,
      },
    ],
  };
}

/**
 * Generate Frame metadata for win announcement
 */
export function generateWinFrame(marketId: string, winnings: string): FrameMetadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return {
    version: 'vNext',
    image: `${appUrl}/api/og/win/${marketId}/${winnings}`,
    imageAspectRatio: '1.91:1',
    buttons: [
      {
        index: 1,
        label: 'Claim Winnings',
        action: 'link',
        target: `${appUrl}/profile`,
      },
      {
        index: 2,
        label: 'View Market',
        action: 'link',
        target: `${appUrl}/markets/${marketId}`,
      },
      {
        index: 3,
        label: 'Find More Markets',
        action: 'link',
        target: `${appUrl}/markets`,
      },
    ],
  };
}

/**
 * Validate Frame signature (for Frame button interactions)
 */
export interface FrameValidationResult {
  valid: boolean;
  fid?: number;
  error?: string;
}

export async function validateFrameSignature(
  body: any
): Promise<FrameValidationResult> {
  try {
    // Frame signature validation would typically use Farcaster Hub API
    // For now, we'll do basic validation
    
    if (!body.untrustedData || !body.trustedData) {
      return {
        valid: false,
        error: 'Missing frame data',
      };
    }

    const { fid, messageHash } = body.untrustedData;
    
    if (!fid || !messageHash) {
      return {
        valid: false,
        error: 'Invalid frame data',
      };
    }

    // In production, verify the signature using Farcaster Hub API
    // const hubUrl = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';
    // const response = await fetch(`${hubUrl}/v1/validateMessage`, {
    //   method: 'POST',
    //   body: JSON.stringify(body.trustedData),
    // });
    
    return {
      valid: true,
      fid,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Validation failed',
    };
  }
}
