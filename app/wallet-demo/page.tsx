'use client';

import { Wallet } from '@/components/wallet';
import { useWallet } from '@/lib/hooks/useWallet';
import { useTransaction } from '@/lib/hooks/useTransaction';
import { TransactionStatus } from '@/components/wallet';
import { parseEther } from 'viem';
import { useState } from 'react';

export default function WalletDemoPage() {
  const { address, chainId, balance, isConnected, isSupportedChain } =
    useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const { execute, status, hash, error, reset } = useTransaction({
    onSuccess: (receipt) => {
      console.log('Transaction successful:', receipt);
      setRecipient('');
      setAmount('');
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
    },
  });

  const handleSendTransaction = async () => {
    if (!recipient || !amount) return;

    try {
      await execute({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wallet Integration Demo
        </h1>

        {/* Wallet Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Wallet Connection
          </h2>
          <Wallet showBalance />
        </div>

        {/* Wallet Info */}
        {isConnected && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Wallet Information
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Address:
                </span>
                <p className="text-sm text-gray-900 font-mono">{address}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Chain ID:
                </span>
                <p className="text-sm text-gray-900">{chainId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Balance:
                </span>
                <p className="text-sm text-gray-900">
                  {balance ? (Number(balance) / 1e18).toFixed(4) : '0'} ETH
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Network Status:
                </span>
                <p
                  className={`text-sm font-medium ${
                    isSupportedChain ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isSupportedChain ? 'Supported Network' : 'Unsupported Network'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Send Transaction */}
        {isConnected && isSupportedChain && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Send Transaction
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendTransaction}
                  disabled={
                    !recipient ||
                    !amount ||
                    status === 'preparing' ||
                    status === 'signing' ||
                    status === 'pending'
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'preparing' || status === 'signing' || status === 'pending'
                    ? 'Processing...'
                    : 'Send Transaction'}
                </button>
                {(status === 'success' || status === 'error') && (
                  <button
                    onClick={reset}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        <TransactionStatus
          status={status}
          hash={hash}
          error={error}
          chainId={chainId || undefined}
        />
      </div>
    </div>
  );
}
