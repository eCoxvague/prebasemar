import { kv } from '@vercel/kv';

// Define payload types locally to avoid circular dependencies
export interface MarketCreatedPayload {
  marketId: string;
  title: string;
  category: string;
  creator: string;
  endTime: number;
}

export interface MarketUpdatedPayload {
  marketId: string;
  totalPool: string;
  participantCount: number;
}

export interface MarketResolvedPayload {
  marketId: string;
  winningOutcome: number;
}

export interface BetPlacedPayload {
  marketId: string;
  outcomeId: number;
  amount: string;
  bettor: string;
}

export interface OddsUpdatedPayload {
  marketId: string;
  odds: number[];
  totalPool: string;
}

// Vercel KV pub/sub channels
export const PUBSUB_CHANNELS = {
  MARKET_UPDATES: 'channel:market:updates',
  BET_UPDATES: 'channel:bet:updates',
  ODDS_UPDATES: 'channel:odds:updates',
} as const;

/**
 * Publish market created event to KV pub/sub
 */
export async function publishMarketCreated(
  payload: MarketCreatedPayload
): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.MARKET_UPDATES,
      JSON.stringify({ type: 'created', payload })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish market created:', error);
  }
}

/**
 * Publish market updated event to KV pub/sub
 */
export async function publishMarketUpdated(
  payload: MarketUpdatedPayload
): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.MARKET_UPDATES,
      JSON.stringify({ type: 'updated', payload })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish market updated:', error);
  }
}

/**
 * Publish market resolved event to KV pub/sub
 */
export async function publishMarketResolved(
  payload: MarketResolvedPayload
): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.MARKET_UPDATES,
      JSON.stringify({ type: 'resolved', payload })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish market resolved:', error);
  }
}

/**
 * Publish market cancelled event to KV pub/sub
 */
export async function publishMarketCancelled(marketId: string): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.MARKET_UPDATES,
      JSON.stringify({ type: 'cancelled', payload: { marketId } })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish market cancelled:', error);
  }
}

/**
 * Publish bet placed event to KV pub/sub
 */
export async function publishBetPlaced(
  payload: BetPlacedPayload
): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.BET_UPDATES,
      JSON.stringify({ payload })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish bet placed:', error);
  }
}

/**
 * Publish odds updated event to KV pub/sub
 */
export async function publishOddsUpdated(
  payload: OddsUpdatedPayload
): Promise<void> {
  try {
    await kv.publish(
      PUBSUB_CHANNELS.ODDS_UPDATES,
      JSON.stringify({ payload })
    );
  } catch (error) {
    console.error('[KV PubSub] Failed to publish odds updated:', error);
  }
}
