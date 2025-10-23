'use client';

import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import {
  TransactionHelper,
  TransactionStatus,
  TransactionError,
  parseTransactionError,
} from '@/lib/blockchain/transaction';
import type { Hash, TransactionReceipt } from 'viem';

interface UseTransactionOptions {
  onSuccess?: (receipt: TransactionReceipt) => void;
  onError?: (error: TransactionError) => void;
  confirmations?: number;
  timeout?: number;
}

export function useTransaction(options?: UseTransactionOptions) {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [hash, setHash] = useState<Hash | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [error, setError] = useState<TransactionError | null>(null);

  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const execute = useCallback(
    async (transaction: any) => {
      if (!publicClient || !walletClient) {
        const error = new TransactionError(
          'Wallet not connected',
          'WALLET_NOT_CONNECTED'
        );
        setError(error);
        setStatus('error');
        options?.onError?.(error);
        throw error;
      }

      try {
        const helper = new TransactionHelper(publicClient, walletClient);

        const txReceipt = await helper.execute(transaction, {
          onStatusChange: setStatus,
          confirmations: options?.confirmations,
          timeout: options?.timeout,
        });

        setHash(helper.getHash());
        setReceipt(txReceipt);
        setError(null);
        options?.onSuccess?.(txReceipt);

        return txReceipt;
      } catch (err) {
        const txError = parseTransactionError(err);
        setError(txError);
        setStatus('error');
        options?.onError?.(txError);
        throw txError;
      }
    },
    [publicClient, walletClient, options]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setHash(null);
    setReceipt(null);
    setError(null);
  }, []);

  return {
    execute,
    reset,
    status,
    hash,
    receipt,
    error,
    isLoading: status === 'preparing' || status === 'signing' || status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
