import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { PREDICTION_MARKET_ABI, CONTRACT_ADDRESS, getCreationFee } from '@/lib/blockchain';

interface CreateMarketParams {
  title: string;
  description: string;
  outcomes: string[];
  endTime: Date;
  category: string;
}

interface CreateMarketResult {
  createMarket: (params: CreateMarketParams) => Promise<{ marketId: string; txHash: string }>;
  isCreating: boolean;
  isConfirming: boolean;
  error: Error | null;
  txHash: string | null;
}

export function useCreateMarket(): CreateMarketResult {
  const { address } = useAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  const createMarket = async (params: CreateMarketParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    setIsCreating(true);
    setError(null);

    try {
      // Get creation fee from contract
      const creationFee = await getCreationFee();

      // Convert end time to Unix timestamp
      const endTimeTimestamp = BigInt(Math.floor(params.endTime.getTime() / 1000));

      // Extract outcome names
      const outcomeNames = params.outcomes;

      // Call smart contract
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'createMarket',
        args: [params.title, outcomeNames, endTimeTimestamp],
        value: creationFee,
      });

      setTxHash(hash);

      // Wait for transaction confirmation
      // Note: In production, you might want to use useWaitForTransactionReceipt hook
      // For now, we'll return immediately with the hash

      // Invalidate cache after successful creation
      await fetch('/api/markets/invalidate-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // The marketId will be emitted in the event, but for simplicity
      // we'll need to parse it from the transaction receipt
      // For now, return a placeholder
      return {
        marketId: 'pending', // Will be updated when we parse the event
        txHash: hash,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create market');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createMarket,
    isCreating,
    isConfirming,
    error,
    txHash,
  };
}
