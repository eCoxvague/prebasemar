'use client';

import { TransactionStatus as TxStatus } from '@/lib/blockchain/transaction';
import type { Hash } from 'viem';

interface TransactionStatusProps {
  status: TxStatus;
  hash?: Hash | null;
  error?: Error | null;
  chainId?: number;
}

export function TransactionStatus({
  status,
  hash,
  error,
  chainId,
}: TransactionStatusProps) {
  const getExplorerUrl = (hash: Hash) => {
    const baseUrl =
      chainId === 8453
        ? 'https://basescan.org'
        : 'https://sepolia.basescan.org';
    return `${baseUrl}/tx/${hash}`;
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <div
        className={`rounded-lg shadow-lg p-4 ${
          status === 'error'
            ? 'bg-red-50 border border-red-200'
            : status === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        {/* Status Icon and Title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {status === 'preparing' && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'signing' && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'pending' && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'success' && (
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {status === 'error' && (
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                status === 'error'
                  ? 'text-red-900'
                  : status === 'success'
                  ? 'text-green-900'
                  : 'text-blue-900'
              }`}
            >
              {status === 'preparing' && 'Preparing transaction...'}
              {status === 'signing' && 'Please sign transaction'}
              {status === 'pending' && 'Transaction pending...'}
              {status === 'success' && 'Transaction successful!'}
              {status === 'error' && 'Transaction failed'}
            </p>

            {/* Error message */}
            {status === 'error' && error && (
              <p className="mt-1 text-xs text-red-700">{error.message}</p>
            )}

            {/* Transaction hash link */}
            {hash && (
              <a
                href={getExplorerUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-1 text-xs inline-flex items-center gap-1 ${
                  status === 'error'
                    ? 'text-red-600 hover:text-red-700'
                    : status === 'success'
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                View on explorer
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
