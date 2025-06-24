'use client';

import { useCompareStore } from '@/lib/compareStore';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CandidateScore {
  attemptId: string;
  invitationId: string | null;
  candidateName: string;
  candidateEmail: string;
  completedAt: Date;
  durationSeconds: number;
  scoreLogical: number;
  scoreVerbal: number;
  scoreNumerical: number;
  scoreAttention: number;
  scoreOther: number;
  composite: number;
  compositeUnweighted?: number; // Add unweighted score
  percentile: number;
  rank: number;
  isPublicAttempt?: boolean;
}

interface LeaderboardData {
  rows: CandidateScore[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
  };
}

interface LeaderboardTableProps {
  data: LeaderboardData;
  onPageChange?: (page: number) => void; // Make optional since we removed pagination
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  showWeightedScores?: boolean;
}

const InlineBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const percentage = Math.min(100, Math.max(0, ((value || 0) / max) * 100));

  return (
    <div className="flex items-center space-x-1">
      <div className="h-1.5 flex-1 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-gray-600">
        {value !== null && value !== undefined ? `${value.toFixed(0)}%` : '0%'}
      </span>
    </div>
  );
};

const SortButton = ({
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  column: string;
  currentSort: string;
  currentOrder: string;
  onSort: (column: string, order: 'asc' | 'desc') => void;
}) => {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';

  // Map column names to display labels
  const getColumnLabel = (col: string): string => {
    const labels: Record<string, string> = {
      rank: 'Rank',
      candidateName: 'Name',
      composite: 'Score %',
      percentile: 'Percentile',
      scoreLogical: 'Logical %',
      scoreVerbal: 'Verbal %',
      scoreNumerical: 'Numerical %',
      scoreAttention: 'Attention %',
      scoreOther: 'Other %',
      completedAt: 'Date',
    };
    return labels[col] || col.charAt(0).toUpperCase() + col.slice(1);
  };

  return (
    <button
      onClick={() => onSort(column, nextOrder)}
      className="group -mx-2 -my-1 flex items-center space-x-1 rounded-md px-2 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
      title={`Sort by ${getColumnLabel(column)} (${isActive ? (currentOrder === 'asc' ? 'ascending' : 'descending') : 'click to sort'})`}
    >
      <span className="font-medium">{getColumnLabel(column)}</span>
      <div className="flex flex-col">
        {isActive ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-blue-600" />
          )
        ) : (
          <div className="flex flex-col opacity-30 transition-opacity group-hover:opacity-60">
            <ChevronUp className="-mb-1 h-3 w-3" />
            <ChevronDown className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
};

export default function LeaderboardTable({
  data,
  onPageChange,
  onSort,
  showWeightedScores = false,
}: LeaderboardTableProps) {
  const { toggle, isSelected, selected, startCompare, clear } =
    useCompareStore();
  const [showDetailedColumns, setShowDetailedColumns] = useState(false);

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (rank <= 10) return 'bg-primary-100 text-primary-800 border-primary-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  // Determine which columns should be visible based on data
  const getVisibleColumns = () => {
    if (!data.rows.length) {
      return {
        scoreLogical: false,
        scoreVerbal: false,
        scoreNumerical: false,
        scoreAttention: false,
        scoreOther: false,
      };
    }

    // Check if any candidate has a non-zero score in each category
    const hasLogical = data.rows.some((row) => row.scoreLogical > 0);
    const hasVerbal = data.rows.some((row) => row.scoreVerbal > 0);
    const hasNumerical = data.rows.some((row) => row.scoreNumerical > 0);
    const hasAttention = data.rows.some((row) => row.scoreAttention > 0);
    const hasOther = data.rows.some((row) => row.scoreOther > 0);

    return {
      scoreLogical: hasLogical,
      scoreVerbal: hasVerbal,
      scoreNumerical: hasNumerical,
      scoreAttention: hasAttention,
      scoreOther: hasOther,
    };
  };

  const visibleColumns = getVisibleColumns();

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      {/* Compare Bar */}
      {selected.length > 0 && (
        <div className="border-b border-primary-200 bg-primary-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selected.length} candidate{selected.length !== 1 ? 's' : ''}{' '}
              selected for comparison
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={clear}
                className="text-xs text-red-600 underline hover:text-red-700"
              >
                Clear Selection
              </button>
              {selected.length >= 2 ? (
                <button
                  onClick={startCompare}
                  className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Compare Now
                </button>
              ) : (
                <span className="text-xs text-blue-700">
                  Select at least 2 candidates to compare
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="rank"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="candidateName"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="composite"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              {showDetailedColumns && (
                <th className="px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="percentile"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              {showDetailedColumns && visibleColumns.scoreLogical && (
                <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="scoreLogical"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              {showDetailedColumns && visibleColumns.scoreVerbal && (
                <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="scoreVerbal"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              {showDetailedColumns && visibleColumns.scoreNumerical && (
                <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="scoreNumerical"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              {showDetailedColumns && visibleColumns.scoreAttention && (
                <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="scoreAttention"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              {showDetailedColumns && visibleColumns.scoreOther && (
                <th className="px-2 py-1.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <SortButton
                    column="scoreOther"
                    currentSort={data.filters.sortBy}
                    currentOrder={data.filters.sortOrder}
                    onSort={onSort}
                  />
                </th>
              )}
              <th className="px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="completedAt"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <span>Actions</span>
                  <button
                    onClick={() => setShowDetailedColumns(!showDetailedColumns)}
                    className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    title={
                      showDetailedColumns
                        ? 'Hide detailed columns'
                        : 'Show detailed columns (percentile & category scores)'
                    }
                  >
                    {showDetailedColumns ? (
                      <>
                        <ChevronLeft className="mr-0.5 h-3 w-3" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronRight className="mr-0.5 h-3 w-3" />
                        Expand
                      </>
                    )}
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.rows.map((candidate) => (
              <tr
                key={candidate.attemptId}
                className={`transition-colors hover:bg-gray-50 ${
                  isSelected(candidate.attemptId) ? 'bg-primary-50' : ''
                }`}
              >
                <td className="whitespace-nowrap px-2 py-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium ${getRankBadgeColor(candidate.rank)}`}
                  >
                    #{candidate.rank}
                  </span>
                </td>

                <td className="whitespace-nowrap px-2 py-1.5">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {candidate.candidateName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.candidateEmail}
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-2 py-1.5 text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {candidate.composite !== null &&
                    candidate.composite !== undefined
                      ? `${candidate.composite.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {showWeightedScores &&
                    candidate.compositeUnweighted !== undefined &&
                    candidate.compositeUnweighted !== candidate.composite ? (
                      <div className="space-y-0.5">
                        <div>Weighted</div>
                        <div className="text-gray-400">
                          (Unweighted:{' '}
                          {candidate.compositeUnweighted.toFixed(1)}%)
                        </div>
                      </div>
                    ) : (
                      'Score'
                    )}
                  </div>
                </td>

                {showDetailedColumns && (
                  <td className="whitespace-nowrap px-2 py-1.5 text-center">
                    <div className="text-xs font-bold text-gray-900">
                      {candidate.percentile !== null &&
                      candidate.percentile !== undefined
                        ? `${candidate.percentile.toFixed(1)}th`
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Percentile</div>
                  </td>
                )}

                {showDetailedColumns && visibleColumns.scoreLogical && (
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <InlineBar value={candidate.scoreLogical} />
                  </td>
                )}

                {showDetailedColumns && visibleColumns.scoreVerbal && (
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <InlineBar value={candidate.scoreVerbal} />
                  </td>
                )}

                {showDetailedColumns && visibleColumns.scoreNumerical && (
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <InlineBar value={candidate.scoreNumerical} />
                  </td>
                )}

                {showDetailedColumns && visibleColumns.scoreAttention && (
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <InlineBar value={candidate.scoreAttention} />
                  </td>
                )}

                {showDetailedColumns && visibleColumns.scoreOther && (
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <InlineBar value={candidate.scoreOther} />
                  </td>
                )}

                <td className="whitespace-nowrap px-2 py-1.5 text-center text-xs text-gray-500">
                  {formatDate(candidate.completedAt)}
                </td>

                <td className="whitespace-nowrap px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Link
                      href={`/admin/analytics/analysis/${candidate.attemptId}`}
                      className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                      title="View Analysis"
                    >
                      <Eye className="mr-0.5 h-3 w-3" />
                      Analysis
                    </Link>
                    <button
                      onClick={() => toggle(candidate.attemptId)}
                      disabled={
                        !isSelected(candidate.attemptId) && selected.length >= 5
                      }
                      className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                        isSelected(candidate.attemptId)
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : selected.length >= 5
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={
                        isSelected(candidate.attemptId)
                          ? 'Remove from comparison'
                          : selected.length >= 5
                            ? 'Maximum 5 candidates can be compared'
                            : 'Add to comparison'
                      }
                    >
                      {isSelected(candidate.attemptId) ? '✓' : '+'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-700">
            <span className="font-medium">
              📊 Showing all {data.pagination.total} candidates • Scroll to see
              more results
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Results update instantly when changing weight profiles
          </div>
        </div>
      </div>
    </div>
  );
}
