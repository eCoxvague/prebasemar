import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  // Connected wallet info
  address: string | null;
  chainId: number | null;
  balance: bigint | null;
  isConnected: boolean;

  // Network validation
  isCorrectNetwork: boolean;
  requiredChainId: number | null;

  // Actions
  setWalletInfo: (
    address: string | null,
    chainId: number | null,
    balance: bigint | null
  ) => void;
  setBalance: (balance: bigint) => void;
  setRequiredChainId: (chainId: number) => void;
  validateNetwork: () => boolean;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      isCorrectNetwork: true,
      requiredChainId: null,

      // Set wallet info when connected
      setWalletInfo: (address, chainId, balance) => {
        const state = get();
        const isCorrectNetwork =
          !state.requiredChainId || chainId === state.requiredChainId;

        set({
          address,
          chainId,
          balance,
          isConnected: !!address,
          isCorrectNetwork,
        });
      },

      // Update balance
      setBalance: (balance) => {
        set({ balance });
      },

      // Set required chain ID for validation
      setRequiredChainId: (chainId) => {
        const state = get();
        const isCorrectNetwork = !chainId || state.chainId === chainId;

        set({
          requiredChainId: chainId,
          isCorrectNetwork,
        });
      },

      // Validate if connected to correct network
      validateNetwork: () => {
        const state = get();
        if (!state.requiredChainId || !state.chainId) {
          return true;
        }
        const isCorrect = state.chainId === state.requiredChainId;
        set({ isCorrectNetwork: isCorrect });
        return isCorrect;
      },

      // Disconnect wallet
      disconnect: () => {
        set({
          address: null,
          chainId: null,
          balance: null,
          isConnected: false,
          isCorrectNetwork: true,
        });
      },
    }),
    {
      name: 'wallet-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        requiredChainId: state.requiredChainId,
      }),
    }
  )
);
