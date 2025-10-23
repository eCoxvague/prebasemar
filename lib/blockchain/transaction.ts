import {
  type PublicClient,
  type WalletClient,
  type Hash,
  type TransactionReceipt,
  parseEther,
  formatEther,
} from 'viem';

/**
 * Transaction status types
 */
export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'pending'
  | 'success'
  | 'error';

/**
 * Transaction error types
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Parse transaction error and return user-friendly message
 */
export function parseTransactionError(error: any): TransactionError {
  // User rejected transaction
  if (
    error.message?.includes('User rejected') ||
    error.message?.includes('user rejected')
  ) {
    return new TransactionError(
      'Transaction was rejected by user',
      'USER_REJECTED',
      error
    );
  }

  // Insufficient funds
  if (
    error.message?.includes('insufficient funds') ||
    error.message?.includes('Insufficient funds')
  ) {
    return new TransactionError(
      'Insufficient funds for transaction',
      'INSUFFICIENT_FUNDS',
      error
    );
  }

  // Gas estimation failed
  if (error.message?.includes('gas')) {
    return new TransactionError(
      'Gas estimation failed. Transaction may fail.',
      'GAS_ESTIMATION_FAILED',
      error
    );
  }

  // Network error
  if (error.message?.includes('network') || error.message?.includes('RPC')) {
    return new TransactionError(
      'Network error. Please check your connection.',
      'NETWORK_ERROR',
      error
    );
  }

  // Contract revert
  if (error.message?.includes('revert')) {
    return new TransactionError(
      'Transaction reverted. Please check contract conditions.',
      'CONTRACT_REVERT',
      error
    );
  }

  // Generic error
  return new TransactionError(
    error.message || 'Transaction failed',
    'UNKNOWN_ERROR',
    error
  );
}

/**
 * Estimate gas for a transaction with buffer
 */
export async function estimateGasWithBuffer(
  publicClient: PublicClient,
  transaction: any,
  bufferPercent: number = 20
): Promise<bigint> {
  try {
    const estimatedGas = await publicClient.estimateGas(transaction);
    // Add buffer to prevent out of gas errors
    const buffer = (estimatedGas * BigInt(bufferPercent)) / BigInt(100);
    return estimatedGas + buffer;
  } catch (error) {
    throw parseTransactionError(error);
  }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: Hash,
  confirmations: number = 1,
  timeout: number = 60000 // 60 seconds
): Promise<TransactionReceipt> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
      timeout,
    });

    if (receipt.status === 'reverted') {
      throw new TransactionError(
        'Transaction reverted',
        'TRANSACTION_REVERTED',
        receipt
      );
    }

    return receipt;
  } catch (error) {
    throw parseTransactionError(error);
  }
}

/**
 * Get transaction status from receipt
 */
export function getTransactionStatus(
  receipt: TransactionReceipt | null
): 'success' | 'failed' | 'pending' {
  if (!receipt) return 'pending';
  return receipt.status === 'success' ? 'success' : 'failed';
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} Gwei`;
}

/**
 * Calculate transaction cost
 */
export function calculateTransactionCost(
  gasUsed: bigint,
  gasPrice: bigint
): bigint {
  return gasUsed * gasPrice;
}

/**
 * Format transaction cost for display
 */
export function formatTransactionCost(cost: bigint): string {
  return `${formatEther(cost)} ETH`;
}

/**
 * Check if user has sufficient balance for transaction
 */
export function hasSufficientBalance(
  balance: bigint,
  amount: bigint,
  estimatedGas: bigint,
  gasPrice: bigint
): boolean {
  const totalCost = amount + estimatedGas * gasPrice;
  return balance >= totalCost;
}

/**
 * Transaction helper class for managing transaction lifecycle
 */
export class TransactionHelper {
  private status: TransactionStatus = 'idle';
  private hash: Hash | null = null;
  private receipt: TransactionReceipt | null = null;
  private error: TransactionError | null = null;

  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient
  ) {}

  /**
   * Get current transaction status
   */
  getStatus(): TransactionStatus {
    return this.status;
  }

  /**
   * Get transaction hash
   */
  getHash(): Hash | null {
    return this.hash;
  }

  /**
   * Get transaction receipt
   */
  getReceipt(): TransactionReceipt | null {
    return this.receipt;
  }

  /**
   * Get transaction error
   */
  getError(): TransactionError | null {
    return this.error;
  }

  /**
   * Execute a transaction with full lifecycle management
   */
  async execute(
    transaction: any,
    options?: {
      onStatusChange?: (status: TransactionStatus) => void;
      confirmations?: number;
      timeout?: number;
    }
  ): Promise<TransactionReceipt> {
    const { onStatusChange, confirmations = 1, timeout = 60000 } = options || {};

    try {
      // Reset state
      this.status = 'preparing';
      this.hash = null;
      this.receipt = null;
      this.error = null;
      onStatusChange?.('preparing');

      // Estimate gas
      const gas = await estimateGasWithBuffer(this.publicClient, transaction);

      // Sign transaction
      this.status = 'signing';
      onStatusChange?.('signing');

      // Send transaction
      this.hash = await this.walletClient.sendTransaction({
        ...transaction,
        gas,
      });

      // Wait for confirmation
      this.status = 'pending';
      onStatusChange?.('pending');

      this.receipt = await waitForTransaction(
        this.publicClient,
        this.hash,
        confirmations,
        timeout
      );

      // Success
      this.status = 'success';
      onStatusChange?.('success');

      return this.receipt;
    } catch (error) {
      this.status = 'error';
      this.error = parseTransactionError(error);
      onStatusChange?.('error');
      throw this.error;
    }
  }

  /**
   * Reset transaction state
   */
  reset(): void {
    this.status = 'idle';
    this.hash = null;
    this.receipt = null;
    this.error = null;
  }
}
