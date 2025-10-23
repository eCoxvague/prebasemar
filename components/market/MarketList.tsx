'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarketCard from './MarketCard';
import { useMarkets } from '@/lib/hooks/useMarkets';

const CATEGORIES = [
  'All',
  'Sports',
  'Politics',
  'Entertainment',
  'Technology',
  'Crypto',
  'Social',
  'Other',
];

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'resolved', label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'popular', label: 'Most Popular' },
];

export default function MarketList() {
  const router = useRouter();
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'ending-soon' | 'popular'>('newest');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, error } = useMarkets({
    category: category === 'All' ? undefined : category,
    status,
    search,
    sort,
    page,
    limit: 20,
  });

  const handleMarketClick = (marketId: string) => {
    router.push(`/markets/${marketId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as 'newest' | 'ending-soon' | 'popular');
    setPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prediction Markets
        </h1>
        <p className="text-gray-600">
          Browse and participate in prediction markets on Base
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat === 'All' ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                (cat === 'All' && !category) || category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status and Sort */}
        <div className="flex gap-4">
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={handleSortChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading markets...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load markets. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.data.markets.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg mb-2">No markets found</p>
          <p className="text-gray-500">
            Try adjusting your filters or create a new market
          </p>
        </div>
      )}

      {/* Market Grid */}
      {!isLoading && !error && data && data.data.markets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.data.markets.map((market) => (
              <MarketCard
                key={market.marketId}
                market={market}
                onClick={() => handleMarketClick(market.marketId)}
                showStats
              />
            ))}
          </div>

          {/* Pagination */}
          {data.data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {data.data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.data.totalPages, p + 1))}
                disabled={page === data.data.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
