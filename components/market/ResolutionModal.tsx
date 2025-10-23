'use client';

import { useState } from 'react';
import type { CachedMarket, CachedOutcome } from '@/lib/kv/types';

interface ResolutionModalProps {
  market: CachedMarket;
  onConfirm: (winningOutcomeId: number) => Promise<void>;
  onClose: () => void;
}

export default function ResolutionModal({
  market,
  onConfirm,
  onClose,
}: ResolutionModalProps) {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectOutcome = (outcomeId: number) => {
    setSelectedOutcomeId(outcomeId);
    setError(null);
  };

  const handleProceed = () => {
    if (selectedOutcomeId === null) {
      setError('Please select a winning outcome');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (selectedOutcomeId === null) return;

    try {
      setError(null);
      setIsLoading(true);
      await onConfirm(selectedOutcomeId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve market');
      setShowConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const selectedOutcome = market.outcomes.find(
    (o) => o.outcomeId === selectedOutcomeId
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        {!showConfirmation ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Resolve Market
                </h2>
                <p className="text-sm text-gray-600 mt-1">{market.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Select the winning outcome
                  </p>
                  <p>
                    This action is irreversible. Winners will be able to claim
                    their winnings after resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Outcome Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Winning Outcome
              </h3>
              <div className="space-y-3">
                {market.outcomes.map((outcome) => (
                  <button
                    key={outcome.outcomeId}
                    onClick={() => handleSelectOutcome(outcome.outcomeId)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedOutcomeId === outcome.outcomeId
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            selectedOutcomeId === outcome.outcomeId
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedOutcomeId === outcome.outcomeId && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {outcome.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {outcome.totalBets} wei in bets
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-700">
                        {outcome.odds.toFixed(2)}x
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={selectedOutcomeId === null}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Proceed to Confirm
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Screen */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Confirm Resolution
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Please review before confirming
                </p>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Warning: This is final</p>
                  <p>
                    Once confirmed, this action cannot be undone. Make sure you
                    have selected the correct winning outcome.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resolution Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Market</span>
                  <span className="font-medium text-gray-900">
                    {market.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Winning Outcome</span>
                  <span className="font-bold text-green-600">
                    {selectedOutcome?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pool</span>
                  <span className="font-medium text-gray-900">
                    {market.totalPool} wei
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Resolving...
                  </span>
                ) : (
                  'Confirm Resolution'
                )}
              </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Transaction will be sent to your wallet for confirmation
            </p>
          </>
        )}
      </div>
    </div>
  );
}
