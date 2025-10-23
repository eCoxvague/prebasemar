import { Metadata } from 'next';
import { generateFrameMetadata, generateMarketFrame } from './frames';

/**
 * Generate metadata with Frame tags for market pages
 */
export async function generateMarketMetadata(
  marketId: string,
  marketTitle: string,
  marketDescription?: string
): Promise<Metadata> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const frame = generateMarketFrame(marketId, marketTitle);
  const frameTags = generateFrameMetadata(frame);

  return {
    title: `${marketTitle} | Prediction Market`,
    description: marketDescription || `Place your bets on: ${marketTitle}`,
    openGraph: {
      title: marketTitle,
      description: marketDescription || `Place your bets on: ${marketTitle}`,
      images: [frame.image],
      url: `${appUrl}/markets/${marketId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: marketTitle,
      description: marketDescription || `Place your bets on: ${marketTitle}`,
      images: [frame.image],
    },
    other: frameTags,
  };
}

/**
 * Generate Frame metadata tags as HTML meta tags
 */
export function generateFrameMetaTags(marketId: string, marketTitle: string): string {
  const frame = generateMarketFrame(marketId, marketTitle);
  const tags = generateFrameMetadata(frame);

  return Object.entries(tags)
    .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
    .join('\n');
}
