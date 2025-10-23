'use client';

import { use } from 'react';
import { useAccount } from 'wagmi';
import MarketDetail from '@/components/market/MarketDetail';

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address } = useAccount();

  return <MarketDetail marketId={id} userAddress={address} />;
}
