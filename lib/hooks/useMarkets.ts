import { useQuery } from '@tanstack/react-query';
import type { CachedMarket } from '@/lib/kv/types';

interface UseMarketsParams {
  category?: string;
  status?: string;
  search?: string;
  sort?: 'newest' | 'ending-soon' | 'popular';
  page?: number;
  limit?: number;
}

interface MarketsResponse {
  success: boolean;
  data: {
    markets: CachedMarket[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function useMarkets(params: UseMarketsParams = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.set('category', params.category);
  if (params.status) queryParams.set('status', params.status);
  if (params.search) queryParams.set('search', params.search);
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());

  return useQuery<MarketsResponse>({
    queryKey: ['markets', params],
    queryFn: async () => {
      const response = await fetch(`/api/markets?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useMarket(marketId: string) {
  return useQuery<{ success: boolean; data: CachedMarket }>({
    queryKey: ['market', marketId],
    queryFn: async () => {
      const response = await fetch(`/api/markets/${marketId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market');
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    enabled: !!marketId,
  });
}
