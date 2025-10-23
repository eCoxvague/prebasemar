'use client';

import ShareButton from './ShareButton';

interface ShareBetButtonProps {
  marketId: string;
  outcomeId: number;
  amount: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function ShareBetButton({
  marketId,
  outcomeId,
  amount,
  className = '',
  variant = 'default',
}: ShareBetButtonProps) {
  if (variant === 'compact') {
    return (
      <ShareButton
        type="bet"
        data={{ marketId, outcomeId, amount }}
        className={`text-sm ${className}`}
      >
        Share Bet
      </ShareButton>
    );
  }

  return (
    <ShareButton
      type="bet"
      data={{ marketId, outcomeId, amount }}
      className={className}
    >
      Share My Bet on Farcaster
    </ShareButton>
  );
}
