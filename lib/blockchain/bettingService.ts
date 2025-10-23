import type { Address, Hash } from 'viem';
import { validateBet } from './oddsCalculation';

/**
 * Betting service for handling bet placement flow
 */

export interface BetValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    betAmount: bigint;
    userBalance: bigint;
    marketStatus: string;
    marketEndTime: number;
  };
}

export interface BetPlacementResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  errorCode?: string;
}

/**
 * Validate bet before placement
 */
export async function validateBetPlacement(
  marketId: string,
  outcomeId: number,
  betAmount: bigint,
  userBalance: bigint,
  walletAddress: Address
): Promise<BetValidationResult> {
  try {
    // Validate bet amount against balance
    const amountValidation = validateBet(betAmount, userBalance);
    if (!amountValidation.valid) {
      return {
        valid: false,
        error: amountValidation.error,
      };
    }

    // Call API to validate market status
    const response = await fetch('/api/bets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        outcomeId,
        amount: betAmount.toString(),
        walletAddress,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        valid: false,
        error: data.error || 'Market validation failed',
      };
    }

    return {
      valid: true,
      details: {
        betAmount,
        userBalance,
        marketStatus: 'ACTIVE',
        marketEndTime: 0, // Will be filled by API
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Confirm bet placement after transaction
 */
export async function confirmBetPlacement(
  marketId: string,
  outcomeId: number,
  amount: bigint,
  txHash: Hash,
  fid?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/bets/confirm', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        marketId,
        outcomeId,
        amount: amount.toString(),
        txHash,
        fid,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to confirm bet',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Confirmation failed',
    };
  }
}

/**
 * Get user's bets for a market
 */
export async function getUserBets(
  fid: number,
  walletAddress: Address,
  status?: 'active' | 'resolved' | 'all'
): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      walletAddress,
      status: status || 'all',
    });

    const response = await fetch(`/api/bets/user/${fid}?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch bets');
    }

    return data.data.bets || [];
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return [];
  }
}

/**
 * Calculate bet summary
 */
export function calculateBetSummary(bets: any[]): {
  totalBets: number;
  totalWagered: bigint;
  activeBets: number;
  wonBets: number;
  lostBets: number;
} {
  let totalWagered = 0n;
  let activeBets = 0;
  let wonBets = 0;
  let lostBets = 0;

  for (const bet of bets) {
    totalWagered += BigInt(bet.amount);

    if (bet.market?.status === 0) {
      activeBets++;
    } else if (bet.market?.status === 2) {
      // Resolved
      if (bet.market.winningOutcome === bet.outcomeId) {
        wonBets++;
      } else {
        lostBets++;
      }
    }
  }

  return {
    totalBets: bets.length,
    totalWagered,
    activeBets,
    wonBets,
    lostBets,
  };
}

/**
 * Check if user can place bet
 */
export function canPlaceBet(
  isConnected: boolean,
  isCorrectNetwork: boolean,
  marketStatus: number,
  marketEndTime: number
): { canBet: boolean; reason?: string } {
  if (!isConnected) {
    return { canBet: false, reason: 'Wallet not connected' };
  }

  if (!isCorrectNetwork) {
    return { canBet: false, reason: 'Wrong network' };
  }

  if (marketStatus !== 0) {
    return { canBet: false, reason: 'Market not active' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (marketEndTime <= now) {
    return { canBet: false, reason: 'Market has ended' };
  }

  return { canBet: true };
}

/**
 * Format bet error for user display
 */
export function formatBetError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Handle common error messages
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient balance';
    }
    if (error.message.includes('Market not active')) {
      return 'This market is no longer accepting bets';
    }
    if (error.message.includes('Market has ended')) {
      return 'This market has ended';
    }
    return error.message;
  }

  return 'An unexpected error occurred';
}
