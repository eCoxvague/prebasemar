'use client';

import { useState } from 'react';

interface ShareButtonProps {
  type: 'market' | 'bet' | 'win';
  data: {
    marketId: string;
    outcomeId?: number;
    amount?: string;
    winnings?: string;
    customText?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export default function ShareButton({
  type,
  data,
  className = '',
  children,
}: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/social/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share');
      }

      const result = await response.json();
      setSuccess(true);

      // Open Warpcast in new tab
      if (result.castUrl) {
        window.open(result.castUrl, '_blank');
      }

      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to share');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Sharing...';
    if (success) return 'Shared! ✓';
    if (children) return children;
    
    switch (type) {
      case 'market':
        return 'Share Market';
      case 'bet':
        return 'Share Bet';
      case 'win':
        return 'Share Win';
      default:
        return 'Share';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        disabled={loading || success}
        className={`
          inline-flex items-center justify-center space-x-2
          px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            success
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }
          ${loading || success ? 'opacity-75 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
        </svg>
        <span>{getButtonText()}</span>
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-max">
          <div className="bg-red-900/90 text-red-200 text-sm px-3 py-2 rounded-lg shadow-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
