'use client';

import { useCompareStore } from '@/lib/compareStore';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';

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
  onPageChange: (page: number) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const InlineBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const percentage = Math.min(100, Math.max(0, ((value || 0) / max) * 100));

  return (
    <div className="flex items-center space-x-2">
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-gray-600">
        {value ? value.toFixed(0) : '0'}
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

  return (
    <button
      onClick={() => onSort(column, nextOrder)}
      className="flex items-center space-x-1 transition-colors hover:text-blue-600"
    >
      <span>{column.charAt(0).toUpperCase() + column.slice(1)}</span>
      {isActive ? (
        currentOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ChevronUp className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
};

export default function LeaderboardTable({
  data,
  onPageChange,
  onSort,
}: LeaderboardTableProps) {
  const { toggle, isSelected, selected, startCompare, clear } =
    useCompareStore();

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
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="rank"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="candidateName"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="composite"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Logical
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Verbal
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Numerical
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Attention
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Other
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                <SortButton
                  column="completedAt"
                  currentSort={data.filters.sortBy}
                  currentOrder={data.filters.sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
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
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getRankBadgeColor(candidate.rank)}`}
                  >
                    #{candidate.rank}
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.candidateName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.candidateEmail}
                    </div>
                    <div className="text-xs text-gray-400">
                      {candidate.percentile
                        ? `${candidate.percentile.toFixed(1)}th percentile`
                        : 'N/A'}
                    </div>
                  </div>
                </td>

                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {candidate.composite
                      ? candidate.composite.toFixed(1)
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">Score</div>
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <InlineBar value={candidate.scoreLogical} />
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <InlineBar value={candidate.scoreVerbal} />
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <InlineBar value={candidate.scoreNumerical} />
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <InlineBar value={candidate.scoreAttention} />
                </td>

                <td className="whitespace-nowrap px-3 py-2">
                  <InlineBar value={candidate.scoreOther} />
                </td>

                <td className="whitespace-nowrap px-3 py-2 text-center text-xs text-gray-500">
                  {formatDate(candidate.completedAt)}
                </td>

                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Link
                      href={`/admin/proctor/${candidate.attemptId}`}
                      className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                      title="View Analysis"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Analysis
                    </Link>
                    <button
                      onClick={() => toggle(candidate.attemptId)}
                      disabled={
                        !isSelected(candidate.attemptId) && selected.length >= 5
                      }
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
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

      {/* Pagination */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-700">
            <span>
              Showing{' '}
              {(data.pagination.page - 1) * data.pagination.pageSize + 1} to{' '}
              {Math.min(
                data.pagination.page * data.pagination.pageSize,
                data.pagination.total
              )}{' '}
              of {data.pagination.total} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(data.pagination.page - 1)}
              disabled={!data.pagination.hasPrevious}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {Array.from(
              { length: Math.min(5, data.pagination.totalPages) },
              (_, i) => {
                const page = Math.max(1, data.pagination.page - 2) + i;
                if (page > data.pagination.totalPages) return null;

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`rounded-md px-3 py-2 text-xs font-medium ${
                      page === data.pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              }
            )}

            <button
              onClick={() => onPageChange(data.pagination.page + 1)}
              disabled={!data.pagination.hasNext}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
