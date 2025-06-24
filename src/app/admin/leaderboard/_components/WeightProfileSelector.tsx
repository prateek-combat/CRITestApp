'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CategoryWeights } from '@/types/categories';

interface WeightProfile {
  id: string;
  name: string;
  description: string;
  weights: CategoryWeights;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
}

interface WeightProfileSelectorProps {
  availableProfiles: WeightProfile[];
  currentProfile: WeightProfile | null;
  onProfileChange: (profileId: string | null) => void;
  onCustomWeightsChange?: (weights: CategoryWeights) => void;
  onProfilesChange?: () => void;
}

export default function WeightProfileSelector({
  availableProfiles,
  currentProfile,
  onProfileChange,
  onCustomWeightsChange,
  onProfilesChange,
}: WeightProfileSelectorProps) {
  const [weights, setWeights] = useState<CategoryWeights>({
    LOGICAL: 20,
    VERBAL: 20,
    NUMERICAL: 20,
    ATTENTION_TO_DETAIL: 20,
    OTHER: 20,
  });

  // Initialize with equal weights and set custom mode
  useEffect(() => {
    setWeights({
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    });
  }, []);

  // Debounced function to update custom weights
  const debouncedWeightChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newWeights: CategoryWeights) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (onCustomWeightsChange) {
            onCustomWeightsChange(newWeights);
          }
        }, 300); // 300ms debounce
      };
    })(),
    [onCustomWeightsChange]
  );

  const handleWeightChange = (
    category: keyof CategoryWeights,
    value: number
  ) => {
    const newWeights = { ...weights, [category]: value };

    // Auto-adjust other categories to maintain 100% total
    const otherCategories = Object.keys(newWeights).filter(
      (k) => k !== category
    ) as (keyof CategoryWeights)[];
    const remainingWeight = 100 - value;
    const otherTotal = otherCategories.reduce(
      (sum, cat) => sum + newWeights[cat],
      0
    );

    if (otherTotal > 0) {
      // Proportionally adjust other categories
      otherCategories.forEach((cat) => {
        newWeights[cat] = Math.round(
          (newWeights[cat] / otherTotal) * remainingWeight
        );
      });
    } else {
      // If all others are 0, distribute equally
      const equalShare = Math.round(remainingWeight / otherCategories.length);
      otherCategories.forEach((cat) => {
        newWeights[cat] = equalShare;
      });
    }

    // Ensure total is exactly 100
    const total = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const diff = 100 - total;
      newWeights[otherCategories[0]] += diff;
    }

    setWeights(newWeights);

    // Apply custom weights with debounce
    debouncedWeightChange(newWeights);
  };

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const isValidTotal = totalWeight === 100;

  const categoryLabels: Record<keyof CategoryWeights, string> = {
    LOGICAL: 'Logical',
    VERBAL: 'Verbal',
    NUMERICAL: 'Numerical',
    ATTENTION_TO_DETAIL: 'Attention to Detail',
    OTHER: 'Other',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          Category Weights
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Adjust the importance of each category in scoring
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(weights).map(([category, value]) => (
          <div key={category} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                {categoryLabels[category as keyof CategoryWeights]}
              </label>
              <span className="rounded bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                {value}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              onChange={(e) =>
                handleWeightChange(
                  category as keyof CategoryWeights,
                  parseInt(e.target.value)
                )
              }
              className="slider h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Total indicator and Reset button */}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Total</span>
          <span
            className={`rounded px-2 py-1 font-mono text-xs ${
              isValidTotal
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {totalWeight}%
          </span>
        </div>
        {!isValidTotal && (
          <p className="mt-1 text-xs text-red-600">Total must equal 100%</p>
        )}

        {/* Reset Button */}
        <div className="mt-2">
          <button
            onClick={() => {
              const equalWeights = {
                LOGICAL: 20,
                VERBAL: 20,
                NUMERICAL: 20,
                ATTENTION_TO_DETAIL: 20,
                OTHER: 20,
              };
              setWeights(equalWeights);
              debouncedWeightChange(equalWeights);
            }}
            className="w-full rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            title="Reset all weights to equal (20% each)"
          >
            ⚖️ Reset to Equal Weights
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
