'use client';

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Header } from '@/components/layout/Header';
import { UserProfile, BetHistory, WinningsDisplay } from '@/components/profile';
import { WalletConnect } from '@/components/wallet';
import { useState } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const fid = parseInt(params.fid as string, 10);
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'bets' | 'winnings'>('bets');

  if (isNaN(fid)) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Invalid user ID</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* User Profile Section */}
          <UserProfile
            fid={fid}
            walletAddress={address}
            isOwnProfile={true}
          />

          {/* Wallet Connection */}
          {!isConnected && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Connect Wallet
              </h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to view your bets and manage winnings
              </p>
              <WalletConnect />
            </div>
          )}

          {/* Tabs */}
          {isConnected && address && (
            <>
              <div className="bg-white rounded-lg shadow-md p-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('bets')}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'bets'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    My Bets
                  </button>
                  <button
                    onClick={() => setActiveTab('winnings')}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === 'winnings'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Winnings
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'bets' && (
                <BetHistory
                  fid={fid}
                  walletAddress={address}
                  filter="all"
                />
              )}

              {activeTab === 'winnings' && (
                <WinningsDisplay userId={address} autoRefresh={true} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
