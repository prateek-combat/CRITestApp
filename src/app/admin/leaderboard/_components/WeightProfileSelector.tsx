'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CategoryWeights } from '@/types/categories';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  // Get current status text for each filter
  const getWeightsStatus = () => {
    const customized = Object.entries(pendingWeights).some(
      ([_, value]) => value !== 20
    );
    return customized ? 'Custom' : 'Equal (20% each)';
  };

  const getRiskScoreStatus = () => {
    if (!pendingThreshold || pendingThreshold === 0) return 'Off';
    return `${pendingThresholdMode === 'above' ? '≥' : '≤'} ${pendingThreshold.toFixed(1)}`;
  };

  const getSortStatus = () => {
    const labels: Record<string, string> = {
      composite: 'Score',
      rank: 'Rank',
      candidateName: 'Name',
      percentile: 'Percentile',
      scoreLogical: 'Logical',
      scoreVerbal: 'Verbal',
      scoreNumerical: 'Numerical',
      scoreAttention: 'Attention',
      scoreOther: 'Other',
      completedAt: 'Date',
    };
    return `${labels[pendingSortBy] || pendingSortBy} (${pendingSortOrder === 'asc' ? '↑' : '↓'})`;
  };

  return (
    <div className="space-y-3">
      {/* Compact inline filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sort Options - Always visible */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-ink/70">Sort:</label>
          <select
            value={pendingSortBy}
            onChange={(e) => setPendingSortBy(e.target.value)}
            className="rounded-md border border-ink/20 bg-parchment/80 px-2 py-1 text-xs focus:border-slateblue/50 focus:outline-none focus:ring-1 focus:ring-slateblue/40"
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
          <div className="flex rounded-md border border-ink/20">
            <button
              onClick={() => setPendingSortOrder('asc')}
              className={`px-2 py-1 text-xs ${
                pendingSortOrder === 'asc'
                  ? 'bg-slateblue/100 text-white'
                  : 'bg-parchment/80 text-ink/70 hover:bg-parchment'
              }`}
              title="Ascending"
            >
              ↑
            </button>
            <button
              onClick={() => setPendingSortOrder('desc')}
              className={`px-2 py-1 text-xs ${
                pendingSortOrder === 'desc'
                  ? 'bg-slateblue/100 text-white'
                  : 'bg-parchment/80 text-ink/70 hover:bg-parchment'
              }`}
              title="Descending"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setExpandedSection(expandedSection ? null : 'filters')}
          className="flex items-center gap-1 rounded-md border border-ink/20 bg-parchment/80 px-3 py-1 text-xs hover:bg-parchment"
        >
          <span>Advanced Filters</span>
          {expandedSection === 'filters' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {/* Filter Status Badges */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/50">Active:</span>
          <span className="rounded-full bg-parchment/90 px-2 py-0.5 text-xs">
            Weights: {getWeightsStatus()}
          </span>
          {onScoreThresholdChange && (
            <span className="rounded-full bg-parchment/90 px-2 py-0.5 text-xs">
              Risk: {getRiskScoreStatus()}
            </span>
          )}
        </div>

        {/* Apply button */}
        {hasChanges && (
          <button
            onClick={applyChanges}
            disabled={!isValidTotal}
            className={`ml-auto rounded px-3 py-1 text-xs font-medium transition-colors ${
              isValidTotal
                ? 'bg-slateblue/100 text-white hover:bg-slateblue'
                : 'cursor-not-allowed bg-ink/20 text-ink/50'
            }`}
          >
            Apply Changes
          </button>
        )}
      </div>

      {/* Expandable Advanced Filters */}
      {expandedSection === 'filters' && (
        <div className="rounded-lg border border-ink/10 bg-parchment p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Category Weights */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-ink">
                Category Weights
              </h4>
              <div className="space-y-2">
                {Object.entries(pendingWeights).map(([category, value]) => (
                  <div key={category} className="flex items-center gap-3">
                    <label className="w-24 text-xs font-medium text-ink/70">
                      {categoryLabels[category as keyof CategoryWeights]}:
                    </label>
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
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-ink/10"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`,
                      }}
                    />
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
                      className="w-12 rounded border border-ink/20 px-1 py-0.5 text-center text-xs"
                    />
                    <span className="text-xs text-ink/50">%</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span
                    className={`text-sm font-medium ${
                      isValidTotal ? 'text-ink/70' : 'text-red-600'
                    }`}
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
                    className="rounded border border-ink/20 bg-parchment/80 px-3 py-1 text-xs text-ink/70 hover:bg-parchment"
                  >
                    Reset to Equal
                  </button>
                </div>
              </div>
            </div>

            {/* Risk Score Filter */}
            {onScoreThresholdChange && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-ink">
                  Risk Score Filter
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-xs font-medium text-ink/70">
                      Show candidates with risk score:
                    </span>
                    <div className="flex rounded-md border border-ink/20">
                      <button
                        onClick={() => setPendingThresholdMode('above')}
                        className={`px-3 py-1 text-xs font-medium transition-colors ${
                          pendingThresholdMode === 'above'
                            ? 'bg-slateblue/100 text-white'
                            : 'bg-parchment/80 text-ink/70 hover:bg-parchment'
                        }`}
                      >
                        Above
                      </button>
                      <button
                        onClick={() => setPendingThresholdMode('below')}
                        className={`px-3 py-1 text-xs font-medium transition-colors ${
                          pendingThresholdMode === 'below'
                            ? 'bg-slateblue/100 text-white'
                            : 'bg-parchment/80 text-ink/70 hover:bg-parchment'
                        }`}
                      >
                        Below
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-xs font-medium text-ink/70">
                        Threshold: {pendingThreshold?.toFixed(1) || '0.0'}
                      </label>
                      {pendingThreshold !== null && pendingThreshold > 0 && (
                        <button
                          onClick={() => setPendingThreshold(null)}
                          className="text-xs text-slateblue hover:text-slateblue"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={pendingThreshold ?? 0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setPendingThreshold(value === 0 ? null : value);
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-ink/10"
                      style={{
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(pendingThreshold ?? 0) * 10}%, #e5e7eb ${(pendingThreshold ?? 0) * 10}%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="mt-1 flex justify-between text-xs text-ink/50">
                      <span>0</span>
                      <span>2.5</span>
                      <span>5</span>
                      <span>7.5</span>
                      <span>10</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink/50">
                    {pendingThreshold === null || pendingThreshold === 0
                      ? 'No risk score filtering applied'
                      : `Showing candidates with risk score ${
                          pendingThresholdMode === 'above' ? '≥' : '≤'
                        } ${pendingThreshold.toFixed(1)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        input[type='range']::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        input[type='range']:focus {
          outline: none;
        }

        input[type='range']:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
