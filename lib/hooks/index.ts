/**
 * Polling and Real-time Update Hooks
 * 
 * This module exports all hooks related to polling and real-time updates
 * implemented for task 8.1.
 * 
 * @example
 * ```tsx
 * import { usePolling, useMarketOdds, useOptimisticUpdate } from '@/lib/hooks';
 * ```
 */

// Generic polling hook
export { usePolling } from './usePolling';
export type { UsePollingOptions, UsePollingReturn } from './usePolling';

// Market odds polling hook
export { useMarketOdds, useRefreshOdds } from './useMarketOdds';
export type {
  UseMarketOddsOptions,
  UseMarketOddsReturn,
} from './useMarketOdds';

// Optimistic update hooks
export {
  useOptimisticUpdate,
  useOptimisticList,
} from './useOptimisticUpdate';
export type {
  OptimisticUpdateOptions,
  OptimisticUpdateReturn,
} from './useOptimisticUpdate';

// Re-export existing hooks for convenience
export { useMarkets, useMarket } from './useMarkets';
export { useWallet } from './useWallet';
export { useTransaction } from './useTransaction';
