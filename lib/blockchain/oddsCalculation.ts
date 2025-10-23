import type { CachedMarket, CachedOutcome } from '@/lib/kv/types';
import { getCachedOdds, cacheOdds } from '@/lib/kv';
import { getMarketOutcomes } from './contract';

/**
 * Constants for odds calculation (matching AMMLibrary.sol)
 */
const MIN_ODDS = 1.01;
const MAX_ODDS = 100.0;

/**
 * Calculate odds for a single outcome using constant product formula
 * Matches the AMMLibrary.sol implementation
 */
export function calculateOutcomeOdds(
  totalPool: bigint,
  outcomeLiquidity: bigint,
  numOutcomes: number
): number {
  if (outcomeLiquidity <= 0n) {
    return MAX_ODDS;
  }

  if (totalPool === 0n) {
    // Equal odds for all outcomes initially
    return numOutcomes;
  }

  // Calculate odds: totalPool / outcomeLiquidity
  const odds = Number(totalPool * 100n / outcomeLiquidity) / 100;

  // Apply min/max bounds
  if (odds < MIN_ODDS) {
    return MIN_ODDS;
  }
  if (odds > MAX_ODDS) {
    return MAX_ODDS;
  }

  return odds;
}

/**
 * Calculate odds for all outcomes in a market
 */
export function calculateAllOdds(outcomes: CachedOutcome[]): number[] {
  // Calculate total liquidity
  const totalLiquidity = outcomes.reduce(
    (sum, outcome) => sum + BigInt(outcome.totalBets),
    0n
  );

  return outcomes.map((outcome) =>
    calculateOutcomeOdds(
      totalLiquidity,
      BigInt(outcome.totalBets),
      outcomes.length
    )
  );
}

/**
 * Calculate slippage for a bet
 * @param betAmount Amount being bet
 * @param currentLiquidity Current liquidity for the outcome
 * @returns Slippage percentage (0-100)
 */
export function calculateSlippage(
  betAmount: bigint,
  currentLiquidity: bigint
): number {
  if (currentLiquidity <= 0n || betAmount === 0n) {
    return 0;
  }

  // Slippage = (betAmount / currentLiquidity) * 100
  const slippage = Number((betAmount * 10000n) / currentLiquidity) / 100;

  // Cap at 100%
  return Math.min(slippage, 100);
}

/**
 * Calculate potential winnings for a bet
 * @param betAmount Amount being bet
 * @param odds Current odds
 * @returns Potential winnings amount
 */
export function calculatePotentialWinnings(
  betAmount: bigint,
  odds: number
): bigint {
  if (betAmount <= 0n || odds < MIN_ODDS) {
    return 0n;
  }

  // Winnings = betAmount * odds
  const winnings = (betAmount * BigInt(Math.floor(odds * 100))) / 100n;
  return winnings;
}

/**
 * Calculate new odds after a bet is placed
 * @param outcomes Current outcomes
 * @param outcomeId Outcome being bet on
 * @param betAmount Amount being bet
 * @returns New odds for all outcomes
 */
export function calculateNewOdds(
  outcomes: CachedOutcome[],
  outcomeId: number,
  betAmount: bigint
): number[] {
  // Create a copy of outcomes with updated liquidity
  const updatedOutcomes = outcomes.map((outcome, index) => {
    if (index === outcomeId) {
      return {
        ...outcome,
        totalBets: (BigInt(outcome.totalBets) + betAmount).toString(),
      };
    }
    return outcome;
  });

  return calculateAllOdds(updatedOutcomes);
}

/**
 * Calculate odds impact of a bet (how much odds will change)
 * @param outcomes Current outcomes
 * @param outcomeId Outcome being bet on
 * @param betAmount Amount being bet
 * @returns Object with current odds, new odds, and change percentage
 */
export function calculateOddsImpact(
  outcomes: CachedOutcome[],
  outcomeId: number,
  betAmount: bigint
): {
  currentOdds: number[];
  newOdds: number[];
  changes: number[];
} {
  const currentOdds = calculateAllOdds(outcomes);
  const newOdds = calculateNewOdds(outcomes, outcomeId, betAmount);

  const changes = currentOdds.map((current, index) => {
    const change = ((newOdds[index] - current) / current) * 100;
    return change;
  });

  return {
    currentOdds,
    newOdds,
    changes,
  };
}

/**
 * Get odds for a market with caching
 * @param marketId Market ID
 * @param outcomes Market outcomes
 * @returns Cached or freshly calculated odds
 */
export async function getOddsWithCache(
  marketId: string,
  outcomes: CachedOutcome[]
): Promise<number[]> {
  // Try to get from cache first
  const cachedOdds = await getCachedOdds(marketId);

  if (cachedOdds) {
    return cachedOdds;
  }

  // Calculate fresh odds
  const odds = calculateAllOdds(outcomes);

  // Cache the results (30s TTL)
  await cacheOdds(marketId, odds);

  return odds;
}

/**
 * Get odds from blockchain and cache them
 * @param marketId Market ID
 * @returns Odds array
 */
export async function getOddsFromBlockchain(
  marketId: string
): Promise<number[]> {
  try {
    const outcomes = await getMarketOutcomes(BigInt(marketId));
    
    const cachedOutcomes: CachedOutcome[] = outcomes.map((outcome: any) => ({
      outcomeId: Number(outcome.id),
      name: outcome.name,
      totalBets: outcome.totalBets.toString(),
      odds: 0, // Will be calculated
    }));

    const odds = calculateAllOdds(cachedOutcomes);
    
    // Cache the results
    await cacheOdds(marketId, odds);

    return odds;
  } catch (error) {
    console.error(`Error fetching odds for market ${marketId}:`, error);
    throw error;
  }
}

/**
 * Calculate platform fee
 * @param amount Amount to calculate fee on
 * @param feePercentage Fee percentage (e.g., 2 for 2%)
 * @returns Fee amount
 */
export function calculatePlatformFee(
  amount: bigint,
  feePercentage: number
): bigint {
  if (feePercentage <= 0 || feePercentage > 100) {
    return 0n;
  }

  return (amount * BigInt(feePercentage)) / 100n;
}

/**
 * Calculate net winnings after platform fee
 * @param grossWinnings Gross winnings before fee
 * @param feePercentage Platform fee percentage
 * @returns Net winnings after fee
 */
export function calculateNetWinnings(
  grossWinnings: bigint,
  feePercentage: number
): bigint {
  const fee = calculatePlatformFee(grossWinnings, feePercentage);
  return grossWinnings - fee;
}

/**
 * Calculate proportional winnings for a user
 * @param betAmount User's bet amount
 * @param totalWinningBets Total bets on winning outcome
 * @param prizePool Total prize pool to distribute
 * @returns User's share of winnings
 */
export function calculateProportionalWinnings(
  betAmount: bigint,
  totalWinningBets: bigint,
  prizePool: bigint
): bigint {
  if (totalWinningBets <= 0n || betAmount > totalWinningBets) {
    return 0n;
  }

  return (betAmount * prizePool) / totalWinningBets;
}

/**
 * Validate bet parameters
 * @param betAmount Bet amount
 * @param userBalance User's balance
 * @param minBet Minimum bet amount
 * @param maxBet Maximum bet amount
 * @returns Validation result with error message if invalid
 */
export function validateBet(
  betAmount: bigint,
  userBalance: bigint,
  minBet: bigint = 0n,
  maxBet: bigint = BigInt(Number.MAX_SAFE_INTEGER)
): { valid: boolean; error?: string } {
  if (betAmount <= 0n) {
    return { valid: false, error: 'Bet amount must be greater than 0' };
  }

  if (betAmount < minBet) {
    return { valid: false, error: `Bet amount must be at least ${minBet}` };
  }

  if (betAmount > maxBet) {
    return { valid: false, error: `Bet amount cannot exceed ${maxBet}` };
  }

  if (betAmount > userBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }

  return { valid: true };
}
