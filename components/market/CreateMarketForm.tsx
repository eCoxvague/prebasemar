'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMarket } from '@/lib/hooks/useCreateMarket';
import { useAccount } from 'wagmi';

// Validation schema
const createMarketSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Please select a category'),
  endTime: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, 'End time must be in the future'),
  outcomes: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, 'Outcome name is required')
          .max(100, 'Outcome name must be less than 100 characters'),
      })
    )
    .min(2, 'Must have at least 2 outcomes')
    .max(5, 'Cannot have more than 5 outcomes'),
});

type CreateMarketFormData = z.infer<typeof createMarketSchema>;

interface CreateMarketFormProps {
  onSuccess: (marketId: string, txHash: string) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Sports',
  'Politics',
  'Entertainment',
  'Technology',
  'Crypto',
  'Social',
  'Other',
];

export default function CreateMarketForm({
  onSuccess,
  onCancel,
}: CreateMarketFormProps) {
  const { address, isConnected } = useAccount();
  const { createMarket, isCreating, isConfirming, error: contractError } = useCreateMarket();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMarketFormData>({
    resolver: zodResolver(createMarketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      endTime: '',
      outcomes: [{ name: '' }, { name: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'outcomes',
  });

  const onSubmit = async (data: CreateMarketFormData) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setError(null);

    try {
      // Extract outcome names from the form data
      const outcomeNames = data.outcomes.map((o) => o.name);

      // Create market on blockchain
      const result = await createMarket({
        title: data.title,
        description: data.description,
        outcomes: outcomeNames,
        endTime: new Date(data.endTime),
        category: data.category,
      });

      // Call success callback
      onSuccess(result.marketId, result.txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create market');
    }
  };

  const isSubmitting = isCreating || isConfirming;
  const displayError = error || contractError?.message;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Market</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Market Title *
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide details about the market, resolution criteria, and any important information..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Category *
          </label>
          <select
            {...register('category')}
            id="category"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* End Time */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            End Date & Time *
          </label>
          <input
            {...register('endTime')}
            type="datetime-local"
            id="endTime"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.endTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.endTime.message}
            </p>
          )}
        </div>

        {/* Outcomes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Outcomes * (2-5 options)
          </label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`outcomes.${index}.name`)}
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Outcome ${index + 1}`}
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.outcomes && (
            <p className="mt-1 text-sm text-red-600">
              {errors.outcomes.message}
            </p>
          )}
          {fields.length < 5 && (
            <button
              type="button"
              onClick={() => append({ name: '' })}
              className="mt-3 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              + Add Outcome
            </button>
          )}
        </div>

        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please connect your wallet to create a market
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {isConfirming && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Transaction is being confirmed... Please wait.
            </p>
          </div>
        )}

        {/* Error Message */}
        {displayError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting || !isConnected}
          >
            {isCreating
              ? 'Creating...'
              : isConfirming
              ? 'Confirming...'
              : 'Create Market'}
          </button>
        </div>
      </form>
    </div>
  );
}
