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
  scoreThreshold?: number;
  onScoreThresholdChange?: (threshold: number | null) => void;
  scoreThresholdMode?: 'above' | 'below';
  onScoreThresholdModeChange?: (mode: 'above' | 'below') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export default function WeightProfileSelector({
  availableProfiles,
  currentProfile,
  onProfileChange,
  onCustomWeightsChange,
  onProfilesChange,
  scoreThreshold,
  onScoreThresholdChange,
  scoreThresholdMode = 'above',
  onScoreThresholdModeChange,
  sortBy = 'composite',
  sortOrder = 'desc',
  onSortChange,
}: WeightProfileSelectorProps) {
  const [weights, setWeights] = useState<CategoryWeights>({
    LOGICAL: 20,
    VERBAL: 20,
    NUMERICAL: 20,
    ATTENTION_TO_DETAIL: 20,
    OTHER: 20,
  });

  // State for pending changes
  const [pendingWeights, setPendingWeights] = useState<CategoryWeights>({
    LOGICAL: 20,
    VERBAL: 20,
    NUMERICAL: 20,
    ATTENTION_TO_DETAIL: 20,
    OTHER: 20,
  });
  const [pendingThreshold, setPendingThreshold] = useState<number | null>(
    scoreThreshold ?? null
  );
  const [pendingThresholdMode, setPendingThresholdMode] = useState<
    'above' | 'below'
  >(scoreThresholdMode);
  const [pendingSortBy, setPendingSortBy] = useState(sortBy);
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>(
    sortOrder
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Initialize with equal weights and set custom mode
  useEffect(() => {
    const initialWeights = {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    };
    setWeights(initialWeights);
    setPendingWeights(initialWeights);
  }, []);

  // Update pending values when props change
  useEffect(() => {
    setPendingThreshold(scoreThreshold ?? null);
    setPendingThresholdMode(scoreThresholdMode);
    setPendingSortBy(sortBy);
    setPendingSortOrder(sortOrder);
  }, [scoreThreshold, scoreThresholdMode, sortBy, sortOrder]);

  // Check if there are any pending changes
  useEffect(() => {
    const weightsChanged =
      JSON.stringify(weights) !== JSON.stringify(pendingWeights);
    const thresholdChanged = (scoreThreshold ?? null) !== pendingThreshold;
    const modeChanged = scoreThresholdMode !== pendingThresholdMode;
    const sortChanged =
      sortBy !== pendingSortBy || sortOrder !== pendingSortOrder;
    setHasChanges(
      weightsChanged || thresholdChanged || modeChanged || sortChanged
    );
  }, [
    weights,
    pendingWeights,
    scoreThreshold,
    pendingThreshold,
    scoreThresholdMode,
    pendingThresholdMode,
    sortBy,
    pendingSortBy,
    sortOrder,
    pendingSortOrder,
  ]);

  // Apply all pending changes
  const applyChanges = () => {
    if (JSON.stringify(weights) !== JSON.stringify(pendingWeights)) {
      setWeights(pendingWeights);
      if (onCustomWeightsChange) {
        onCustomWeightsChange(pendingWeights);
      }
    }

    if (
      (scoreThreshold ?? null) !== pendingThreshold &&
      onScoreThresholdChange
    ) {
      onScoreThresholdChange(pendingThreshold);
    }

    if (
      scoreThresholdMode !== pendingThresholdMode &&
      onScoreThresholdModeChange
    ) {
      onScoreThresholdModeChange(pendingThresholdMode);
    }

    if (
      (sortBy !== pendingSortBy || sortOrder !== pendingSortOrder) &&
      onSortChange
    ) {
      onSortChange(pendingSortBy, pendingSortOrder);
    }

    setHasChanges(false);
  };

  const handleWeightChange = (
    category: keyof CategoryWeights,
    value: number
  ) => {
    const newWeights = { ...pendingWeights, [category]: value };

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

    setPendingWeights(newWeights);
  };

  const totalWeight = Object.values(pendingWeights).reduce(
    (sum, val) => sum + val,
    0
  );
  const isValidTotal = totalWeight === 100;

  const categoryLabels: Record<keyof CategoryWeights, string> = {
    LOGICAL: 'Logical',
    VERBAL: 'Verbal',
    NUMERICAL: 'Numerical',
    ATTENTION_TO_DETAIL: 'Attention',
    OTHER: 'Other',
  };

  return (
    <div className="space-y-4">
      {/* Filters Header with Apply Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Filters & Sorting
        </h3>
        {hasChanges && (
          <button
            onClick={applyChanges}
            disabled={!isValidTotal}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
              isValidTotal
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'cursor-not-allowed bg-gray-300 text-gray-500'
            }`}
          >
            Apply Changes
          </button>
        )}
      </div>

      {/* Filter Sections in Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Category Weights */}
        <div className="rounded-lg border border-gray-200 p-3">
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === 'weights' ? null : 'weights'
              )
            }
            className="mb-2 flex w-full items-center justify-between text-left"
          >
            <h4 className="text-xs font-semibold text-gray-900">
              Category Weights
            </h4>
            <span className="text-xs text-gray-500">
              {expandedSection === 'weights' ? '−' : '+'}
            </span>
          </button>

          {expandedSection === 'weights' && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(pendingWeights).map(([category, value]) => (
                  <div key={category} className="text-center">
                    <label className="text-xs font-medium text-gray-600">
                      {categoryLabels[category as keyof CategoryWeights]}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        handleWeightChange(
                          category as keyof CategoryWeights,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-center text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}
                >
                  Total: {totalWeight}%
                </span>
                <button
                  onClick={() => {
                    const equalWeights = {
                      LOGICAL: 20,
                      VERBAL: 20,
                      NUMERICAL: 20,
                      ATTENTION_TO_DETAIL: 20,
                      OTHER: 20,
                    };
                    setPendingWeights(equalWeights);
                  }}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Risk Score Filter */}
        {onScoreThresholdChange && (
          <div className="rounded-lg border border-gray-200 p-3">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === 'risk' ? null : 'risk')
              }
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h4 className="text-xs font-semibold text-gray-900">
                Risk Score Filter
              </h4>
              <span className="text-xs text-gray-500">
                {expandedSection === 'risk' ? '−' : '+'}
              </span>
            </button>

            {expandedSection === 'risk' && (
              <div className="space-y-2">
                <div className="flex gap-1 rounded-md border border-gray-300 p-0.5">
                  <button
                    onClick={() => setPendingThresholdMode('above')}
                    className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      pendingThresholdMode === 'above'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Above
                  </button>
                  <button
                    onClick={() => setPendingThresholdMode('below')}
                    className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      pendingThresholdMode === 'below'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Below
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">
                      {pendingThresholdMode === 'above' ? 'Minimum' : 'Maximum'}{' '}
                      Score
                    </label>
                    <span className="text-xs text-gray-600">
                      {pendingThreshold !== null
                        ? pendingThreshold.toFixed(1)
                        : '0.0'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={pendingThreshold ?? 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setPendingThreshold(value > 0 ? value : null);
                    }}
                    className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                    style={{
                      background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(pendingThreshold ?? 0) * 10}%, #e5e7eb ${(pendingThreshold ?? 0) * 10}%, #e5e7eb 100%)`,
                    }}
                  />
                  {pendingThreshold && pendingThreshold > 0 && (
                    <button
                      onClick={() => setPendingThreshold(null)}
                      className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sort Options */}
        {onSortChange && (
          <div className="rounded-lg border border-gray-200 p-3">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === 'sort' ? null : 'sort')
              }
              className="mb-2 flex w-full items-center justify-between text-left"
            >
              <h4 className="text-xs font-semibold text-gray-900">
                Sort Options
              </h4>
              <span className="text-xs text-gray-500">
                {expandedSection === 'sort' ? '−' : '+'}
              </span>
            </button>

            {expandedSection === 'sort' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Sort By
                  </label>
                  <select
                    value={pendingSortBy}
                    onChange={(e) => setPendingSortBy(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="composite">Score %</option>
                    <option value="rank">Rank</option>
                    <option value="candidateName">Name</option>
                    <option value="percentile">Percentile</option>
                    <option value="scoreLogical">Logical %</option>
                    <option value="scoreVerbal">Verbal %</option>
                    <option value="scoreNumerical">Numerical %</option>
                    <option value="scoreAttention">Attention %</option>
                    <option value="scoreOther">Other %</option>
                    <option value="completedAt">Date</option>
                  </select>
                </div>
                <div className="flex gap-1 rounded-md border border-gray-300 p-0.5">
                  <button
                    onClick={() => setPendingSortOrder('asc')}
                    className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      pendingSortOrder === 'asc'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Ascending
                  </button>
                  <button
                    onClick={() => setPendingSortOrder('desc')}
                    className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                      pendingSortOrder === 'desc'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Descending
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        input[type='range']::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
