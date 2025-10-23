// Wagmi configuration
export { config, chains, CHAIN_IDS, isSupportedChain, getChainName } from './wagmi';

// Wallet store
export { useWalletStore } from './walletStore';

// Transaction utilities
export {
  TransactionHelper,
  TransactionError,
  parseTransactionError,
  estimateGasWithBuffer,
  waitForTransaction,
  getTransactionStatus,
  formatGasPrice,
  calculateTransactionCost,
  formatTransactionCost,
  hasSufficientBalance,
  type TransactionStatus,
} from './transaction';

// Blockchain utilities
export {
  formatAddress,
  formatEth,
  parseEth,
  isValidAddress,
  isSameAddress,
  getExplorerUrl,
  calculatePercentage,
  addPercentage,
  subtractPercentage,
  formatTimestamp,
  isPastTimestamp,
  getTimeRemaining,
  formatTimeRemaining,
} from './utils';

// Contract utilities
export {
  publicClient,
  PREDICTION_MARKET_ABI,
  CONTRACT_ADDRESS,
  readContract,
  getMarketFromChain,
  getMarketOutcomes,
  getUserBetsForMarket,
  getClaimableWinnings,
  getMarketCounter,
  getCreationFee,
  getPlatformFeePercentage,
  getAllMarketsFromChain,
  mapMarketStatus,
  calculateOdds,
} from './contract';

// Market helpers
export {
  transformMarketData,
  filterMarketsByStatus,
  filterMarketsByCategory,
  searchMarkets,
  sortMarkets,
  paginateMarkets,
  isMarketActive,
  hasMarketEnded,
  getTimeRemaining as getMarketTimeRemaining,
} from './marketHelpers';
