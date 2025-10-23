'use client';

import { useState, useCallback } from 'react';
import { useTransaction } from './useTransaction';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESS, PREDICTION_MARKET_ABI } from '@/lib/blockchain/contract';
import { validateBet } from '@/lib/blockchain/oddsCalculation';
import type { Hash } from 'viem';

interface PlaceBetParams {
  marketId: string;
  outcomeId: number;
  amount: bigint;
  fid?: number;
}

interface PlaceBetResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
}

export function usePlaceBet() {
  const [isValidating, setIsValidating] = useState(false);
  const { address, balance, isConnected, isCorrectNetwork } = useWallet();
  const transaction = useTransaction({
    onSuccess: async (receipt) => {
      console.log('Bet placed successfully:', receipt);
    },
    onError: (error) => {
      console.error('Bet placement failed:', error);
    },
  });

  const placeBet = useCallback(
    async ({
      marketId,
      outcomeId,
      amount,
      fid,
    }: PlaceBetParams): Promise<PlaceBetResult> => {
      try {
        // Pre-flight checks
        if (!isConnected || !address) {
          return {
            success: false,
            error: 'Wallet not connected',
          };
        }

        if (!isCorrectNetwork) {
          return {
            success: false,
            error: 'Please switch to the correct network',
          };
        }

        // Validate bet amount
        setIsValidating(true);
        const validation = validateBet(amount, balance || 0n);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
          };
        }

        // Call API to validate market and get transaction data
        const apiResponse = await fetch('/api/bets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId,
            outcomeId,
            amount: amount.toString(),
            walletAddress: address,
            fid,
          }),
        });

        const apiData = await apiResponse.json();

        if (!apiData.success) {
          return {
            success: false,
            error: apiData.error || 'Failed to validate bet',
          };
        }

        setIsValidating(false);

        // Execute transaction
        const receipt = await transaction.execute({
          address: CONTRACT_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'placeBet',
          args: [BigInt(marketId), outcomeId],
          value: amount,
        });

        // Confirm bet and invalidate cache
        await fetch('/api/bets/confirm', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            marketId,
            outcomeId,
            amount: amount.toString(),
            fid,
            txHash: receipt.transactionHash,
          }),
        });

        return {
          success: true,
          txHash: receipt.transactionHash,
        };
      } catch (error) {
        console.error('Error placing bet:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to place bet',
        };
      } finally {
        setIsValidating(false);
      }
    },
    [address, balance, isConnected, isCorrectNetwork, transaction]
  );

  return {
    placeBet,
    isValidating,
    isLoading: isValidating || transaction.isLoading,
    isSuccess: transaction.isSuccess,
    isError: transaction.isError,
    error: transaction.error,
    hash: transaction.hash,
    receipt: transaction.receipt,
    reset: transaction.reset,
  };
}
