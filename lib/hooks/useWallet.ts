'use client';

import { useEffect } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useWalletStore } from '@/lib/blockchain/walletStore';
import { isSupportedChain } from '@/lib/blockchain/wagmi';

/**
 * Custom hook that syncs wagmi state with Zustand store
 * and provides wallet utilities
 */
export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}`,
  });

  const {
    setWalletInfo,
    setBalance,
    validateNetwork,
    isCorrectNetwork,
    requiredChainId,
  } = useWalletStore();

  // Sync wagmi state to Zustand store
  useEffect(() => {
    if (isConnected && address) {
      setWalletInfo(address, chainId, balanceData?.value || null);
    } else {
      setWalletInfo(null, null, null);
    }
  }, [address, chainId, balanceData, isConnected, setWalletInfo]);

  // Update balance when it changes
  useEffect(() => {
    if (balanceData?.value) {
      setBalance(balanceData.value);
    }
  }, [balanceData, setBalance]);

  // Validate network when chain changes
  useEffect(() => {
    if (isConnected) {
      validateNetwork();
    }
  }, [chainId, isConnected, validateNetwork]);

  return {
    // Wallet info
    address,
    chainId,
    balance: balanceData?.value || null,
    isConnected,

    // Network validation
    isCorrectNetwork,
    requiredChainId,
    isSupportedChain: isSupportedChain(chainId),

    // Utilities
    validateNetwork,
  };
}
