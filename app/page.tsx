import { Header } from '@/components/layout/Header';
import { FarcasterAuth } from '@/components/auth';
import LeaderboardWidget from '@/components/leaderboard/LeaderboardWidget';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center max-w-4xl w-full">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Farcaster Prediction Market
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Decentralized prediction market on Base blockchain
          </p>
          <p className="text-gray-500 mb-12">
            Create markets, place bets, and earn rewards for accurate predictions.
            Powered by Base's low gas fees and Farcaster's social graph.
          </p>
          
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
            <FarcasterAuth />
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6 text-left">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Create Markets</h3>
                <p className="text-gray-600 text-sm">
                  Launch prediction markets on any topic and earn fees from participants.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Place Bets</h3>
                <p className="text-gray-600 text-sm">
                  Bet on outcomes with dynamic odds powered by an automated market maker.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Earn Rewards</h3>
                <p className="text-gray-600 text-sm">
                  Win big by making accurate predictions and claim your rewards instantly.
                </p>
              </div>
            </div>

            <div>
              <LeaderboardWidget />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
