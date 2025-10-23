/**
 * Utility functions for integrating WebSocket broadcasts into API routes
 */

import {
  publishMarketCreated,
  publishMarketUpdated,
  publishMarketResolved,
  publishMarketCancelled,
  publishBetPlaced,
  publishOddsUpdated,
} from '../kv/pubsub';
import type {
  MarketCreatedPayload,
  MarketUpdatedPayload,
  MarketResolvedPayload,
  BetPlacedPayload,
  OddsUpdatedPayload,
} from './server';

/**
 * Notify clients when a new market is created
 */
export async function notifyMarketCreated(
  marketId: string,
  title: string,
  category: string,
  creator: string,
  endTime: number
): Promise<void> {
  const payload: MarketCreatedPayload = {
    marketId,
    title,
    category,
    creator,
    endTime,
  };

  await publishMarketCreated(payload);
}

/**
 * Notify clients when a market is updated (new bet, pool change)
 */
export async function notifyMarketUpdated(
  marketId: string,
  totalPool: string,
  participantCount: number
): Promise<void> {
  const payload: MarketUpdatedPayload = {
    marketId,
    totalPool,
    participantCount,
  };

  await publishMarketUpdated(payload);
}

/**
 * Notify clients when a market is resolved
 */
export async function notifyMarketResolved(
  marketId: string,
  winningOutcome: number
): Promise<void> {
  const payload: MarketResolvedPayload = {
    marketId,
    winningOutcome,
  };

  await publishMarketResolved(payload);
}

/**
 * Notify clients when a market is cancelled
 */
export async function notifyMarketCancelled(marketId: string): Promise<void> {
  await publishMarketCancelled(marketId);
}

/**
 * Notify clients when a bet is placed
 */
export async function notifyBetPlaced(
  marketId: string,
  outcomeId: number,
  amount: string,
  bettor: string
): Promise<void> {
  const payload: BetPlacedPayload = {
    marketId,
    outcomeId,
    amount,
    bettor,
  };

  await publishBetPlaced(payload);
}

/**
 * Notify clients when odds are updated
 */
export async function notifyOddsUpdated(
  marketId: string,
  odds: number[],
  totalPool: string
): Promise<void> {
  const payload: OddsUpdatedPayload = {
    marketId,
    odds,
    totalPool,
  };

  await publishOddsUpdated(payload);
}

/**
 * Batch notify for bet placement (includes bet + odds + market update)
 * This is the most common use case - when a bet is placed, we want to:
 * 1. Notify about the bet
 * 2. Update the odds
 * 3. Update the market stats
 */
export async function notifyBetPlacedWithUpdates(
  marketId: string,
  outcomeId: number,
  betAmount: string,
  bettor: string,
  newOdds: number[],
  newTotalPool: string,
  newParticipantCount: number
): Promise<void> {
  // Execute all notifications in parallel for better performance
  await Promise.all([
    notifyBetPlaced(marketId, outcomeId, betAmount, bettor),
    notifyOddsUpdated(marketId, newOdds, newTotalPool),
    notifyMarketUpdated(marketId, newTotalPool, newParticipantCount),
  ]);
}
