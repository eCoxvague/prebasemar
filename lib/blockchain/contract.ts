import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Address, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import PredictionMarketABI from '@/artifacts/contracts/PredictionMarket.sol/PredictionMarket.json';

// Get contract address from environment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as Address;

if (!CONTRACT_ADDRESS) {
  console.warn('NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS is not set');
}

// Determine which chain to use based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const chain = isDevelopment ? baseSepolia : base;
const rpcUrl = isDevelopment 
  ? process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
  : process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

// Create public client for reading
export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// Contract ABI
export const PREDICTION_MARKET_ABI = PredictionMarketABI.abi;

/**
 * Read contract data
 */
export async function readContract<T>(
  functionName: string,
  args: any[] = []
): Promise<T> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }

  const result = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName,
    args,
  });

  return result as T;
}

/**
 * Get market by ID from blockchain
 */
export async function getMarketFromChain(marketId: bigint) {
  const market = await readContract<any>('getMarket', [marketId]);
  return market;
}

/**
 * Get market outcomes from blockchain
 */
export async function getMarketOutcomes(marketId: bigint) {
  const outcomes = await readContract<any[]>('getOutcomes', [marketId]);
  return outcomes;
}

/**
 * Get user bets for a market from blockchain
 */
export async function getUserBetsForMarket(marketId: bigint, userAddress: Address) {
  const bets = await readContract<any[]>('getUserBetsForMarket', [marketId, userAddress]);
  return bets;
}

/**
 * Get claimable winnings for a user
 */
export async function getClaimableWinnings(marketId: bigint, userAddress: Address) {
  const winnings = await readContract<bigint>('getClaimableWinnings', [marketId, userAddress]);
  return winnings;
}

/**
 * Get market counter (total number of markets)
 */
export async function getMarketCounter(): Promise<bigint> {
  const counter = await readContract<bigint>('marketCounter', []);
  return counter;
}

/**
 * Get creation fee
 */
export async function getCreationFee(): Promise<bigint> {
  const fee = await readContract<bigint>('creationFee', []);
  return fee;
}

/**
 * Get platform fee percentage
 */
export async function getPlatformFeePercentage(): Promise<bigint> {
  const percentage = await readContract<bigint>('platformFeePercentage', []);
  return percentage;
}

/**
 * Get all markets from blockchain (by iterating through market counter)
 */
export async function getAllMarketsFromChain() {
  const marketCounter = await getMarketCounter();
  const markets = [];

  for (let i = 0n; i < marketCounter; i++) {
    try {
      const market = await getMarketFromChain(i);
      const outcomes = await getMarketOutcomes(i);
      markets.push({ ...market, outcomes });
    } catch (error) {
      console.error(`Error fetching market ${i}:`, error);
    }
  }

  return markets;
}

/**
 * Map blockchain market status to app status
 */
export function mapMarketStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'ACTIVE',
    1: 'CLOSED',
    2: 'RESOLVED',
    3: 'CANCELLED',
    4: 'DISPUTED',
  };
  return statusMap[status] || 'ACTIVE';
}

/**
 * Calculate odds for outcomes (simple implementation)
 */
export function calculateOdds(outcomes: any[]): number[] {
  const totalBets = outcomes.reduce((sum, outcome) => sum + BigInt(outcome.totalBets), 0n);
  
  if (totalBets === 0n) {
    // Equal odds if no bets placed
    return outcomes.map(() => outcomes.length);
  }

  return outcomes.map((outcome) => {
    const outcomeBets = BigInt(outcome.totalBets);
    if (outcomeBets === 0n) return 999; // Very high odds for no bets
    
    // Calculate odds: totalPool / outcomeBets
    const odds = Number(totalBets * 100n / outcomeBets) / 100;
    return Math.max(1.01, odds); // Minimum odds of 1.01
  });
}

export { CONTRACT_ADDRESS };
