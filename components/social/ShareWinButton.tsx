'use client';

import ShareButton from './ShareButton';

interface ShareWinButtonProps {
  marketId: string;
  winnings: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function ShareWinButton({
  marketId,
  winnings,
  className = '',
  variant = 'default',
}: ShareWinButtonProps) {
  if (variant === 'compact') {
    return (
      <ShareButton
        type="win"
        data={{ marketId, winnings }}
        className={`text-sm ${className}`}
      >
        Share Win
      </ShareButton>
    );
  }

  return (
    <ShareButton
      type="win"
      data={{ marketId, winnings }}
      className={className}
    >
      🎉 Share My Win on Farcaster
    </ShareButton>
  );
}
