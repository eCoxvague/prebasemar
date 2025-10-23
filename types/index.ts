// Global type definitions
export type MarketStatus =
  | 'ACTIVE'
  | 'CLOSED'
  | 'PENDING_RESOLUTION'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface User {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  creator: User;
  endTime: Date;
  status: MarketStatus;
  totalPool: bigint;
  participantCount: number;
  winningOutcome?: number;
  createdAt: Date;
  txHash: string;
}

export interface Outcome {
  id: string;
  outcomeId: number;
  name: string;
  totalBets: bigint;
  liquidity: bigint;
  odds: number;
}

export interface Bet {
  id: string;
  market: Market;
  outcome: Outcome;
  user: User;
  amount: bigint;
  potentialWinnings: bigint;
  claimed: boolean;
  txHash: string;
  createdAt: Date;
}
