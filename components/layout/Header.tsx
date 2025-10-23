'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { LoginButton } from '@/components/auth/LoginButton';
import { UserProfileDropdown } from '@/components/auth/UserProfileDropdown';

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              Prediction Market
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/markets"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Markets
            </Link>
            <Link
              href="/create"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Create Market
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <UserProfileDropdown />
            ) : (
              <LoginButton variant="primary" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
