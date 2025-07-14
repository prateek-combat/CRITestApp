'use client';

import { useCompareStore } from '@/lib/compareStore';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import LinkButton from '@/components/ui/LinkButton';
import * as XLSX from 'xlsx-js-style';

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
  riskScore?: number | null;
  proctoringEnabled?: boolean;
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
  userRole?: string;
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
  userRole,
}: LeaderboardTableProps) {
  const { toggle, isSelected, selected, startCompare, clear } =
    useCompareStore();
  const [showDetailedColumns, setShowDetailedColumns] = useState(false);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);
  const [exportingLeaderboard, setExportingLeaderboard] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

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

  const handleDeleteAttempt = async (attemptId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this test attempt? This action cannot be undone.'
      )
    ) {
      setConfirmDeleteId(null);
      return;
    }

    setDeletingAttemptId(attemptId);
    try {
      const response = await fetch(`/api/admin/test-attempts/${attemptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete test attempt');
      }

      // Refresh the page to update the data
      window.location.reload();
    } catch (error) {
      alert(
        `Failed to delete test attempt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setDeletingAttemptId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleExportPdf = async (attemptId: string, candidateName: string) => {
    try {
      setExportingPdf(attemptId);

      const response = await fetch('/api/admin/leaderboard/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attemptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${candidateName.replace(/[^a-zA-Z0-9]/g, '_')}_test_results.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPdf(null);
    }
  };

  const handleExportLeaderboard = async () => {
    try {
      setExportingLeaderboard(true);

      // Get top 20 candidates
      const top20 = data.rows.slice(0, 20);
      const attemptIds = top20.map((row) => row.attemptId);

      const response = await fetch('/api/admin/leaderboard/export-bulk-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptIds,
          positionName: 'Top 20 Leaderboard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate leaderboard PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `leaderboard_top20_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting leaderboard:', error);
      alert('Failed to export leaderboard. Please try again.');
    } finally {
      setExportingLeaderboard(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);

      // Prepare data for Excel export
      const excelData = data.rows.map((candidate) => {
        const row: any = {
          Rank: candidate.rank,
          Name: candidate.candidateName,
          Email: candidate.candidateEmail,
          'Score %': candidate.composite?.toFixed(1) || 'N/A',
          Percentile: candidate.percentile?.toFixed(1) || 'N/A',
          'Completed Date': formatDate(candidate.completedAt),
          'Duration (minutes)': Math.round(candidate.durationSeconds / 60),
          'Risk Score':
            candidate.riskScore !== null && candidate.riskScore !== undefined
              ? (candidate.riskScore > 10
                  ? candidate.riskScore / 10
                  : candidate.riskScore
                ).toFixed(1)
              : 'N/A',
          Proctoring: candidate.proctoringEnabled ? 'Enabled' : 'Disabled',
          'Test Type': candidate.isPublicAttempt ? 'Public' : 'Invitation',
        };

        // Add category scores if they exist
        if (visibleColumns.scoreLogical) {
          row['Logical %'] = candidate.scoreLogical?.toFixed(1) || '0';
        }
        if (visibleColumns.scoreVerbal) {
          row['Verbal %'] = candidate.scoreVerbal?.toFixed(1) || '0';
        }
        if (visibleColumns.scoreNumerical) {
          row['Numerical %'] = candidate.scoreNumerical?.toFixed(1) || '0';
        }
        if (visibleColumns.scoreAttention) {
          row['Attention %'] = candidate.scoreAttention?.toFixed(1) || '0';
        }
        if (visibleColumns.scoreOther) {
          row['Other %'] = candidate.scoreOther?.toFixed(1) || '0';
        }

        // Add weighted/unweighted scores if applicable
        if (showWeightedScores && candidate.compositeUnweighted !== undefined) {
          row['Weighted Score %'] = candidate.composite?.toFixed(1) || 'N/A';
          row['Unweighted Score %'] =
            candidate.compositeUnweighted?.toFixed(1) || 'N/A';
        }

        return row;
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');

      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
        wch: Math.max(key.length + 2, 15),
      }));
      ws['!cols'] = colWidths;

      // Style header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'F3F4F6' } },
          alignment: { horizontal: 'center' },
        };
      }

      // Generate filename with date
      const filename = `leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write and download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

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

      {/* Header with Export Buttons and Risk Score Legend */}
      <div className="mb-3 flex items-center justify-between px-6 pt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportLeaderboard}
            disabled={exportingLeaderboard || data.rows.length === 0}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              data.rows.length === 0
                ? 'No data to export'
                : 'Export top 20 candidates to PDF (based on current filters)'
            }
          >
            {exportingLeaderboard ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Leaderboard (PDF)
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || data.rows.length === 0}
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              data.rows.length === 0
                ? 'No data to export'
                : 'Export all visible data to Excel'
            }
          >
            {exportingExcel ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Exporting...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export All (Excel)
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-gray-500">Risk Score Highlighting:</span>
          <span className="flex items-center space-x-1">
            <span className="inline-block h-3 w-6 rounded border border-green-200 bg-green-100"></span>
            <span className="text-gray-600">Low (&lt;2.5)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="inline-block h-3 w-6 rounded border border-yellow-200 bg-yellow-100"></span>
            <span className="text-gray-600">Medium (2.5-5)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="inline-block h-3 w-6 rounded border border-red-200 bg-red-100"></span>
            <span className="text-gray-600">High (&gt;5)</span>
          </span>
        </div>
      </div>

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
            {data.rows.map((candidate) => {
              // Normalize risk score if it's on the old scale (> 10)
              const normalizedRiskScore =
                candidate.riskScore !== null &&
                candidate.riskScore !== undefined &&
                candidate.riskScore > 10
                  ? candidate.riskScore / 10
                  : candidate.riskScore;

              return (
                <tr
                  key={candidate.attemptId}
                  className={`transition-colors ${
                    candidate.proctoringEnabled &&
                    normalizedRiskScore !== null &&
                    normalizedRiskScore !== undefined
                      ? normalizedRiskScore < 2.5
                        ? 'bg-green-50 hover:bg-green-100'
                        : normalizedRiskScore >= 2.5 && normalizedRiskScore <= 5
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-gray-50'
                  } ${
                    isSelected(candidate.attemptId)
                      ? 'ring-2 ring-primary-500'
                      : ''
                  }`}
                  title={
                    candidate.proctoringEnabled &&
                    normalizedRiskScore !== null &&
                    normalizedRiskScore !== undefined
                      ? `Risk Score: ${normalizedRiskScore.toFixed(1)}/10`
                      : ''
                  }
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

                  <td className="whitespace-nowrap px-2 py-1.5 text-center text-xs">
                    <div className="font-medium">
                      {candidate.proctoringEnabled ? (
                        normalizedRiskScore !== null &&
                        normalizedRiskScore !== undefined ? (
                          <span
                            className={`${
                              normalizedRiskScore < 2.5
                                ? 'text-green-700'
                                : normalizedRiskScore <= 5
                                  ? 'text-yellow-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {normalizedRiskScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {candidate.proctoringEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <LinkButton
                        href={`/admin/analytics/analysis/${candidate.attemptId}`}
                        variant="outline"
                        size="xs"
                        startIcon={<Eye className="h-3 w-3" />}
                        className="border-blue-200 bg-blue-100 text-blue-700 hover:border-blue-300 hover:bg-blue-200"
                        title="View Analysis"
                      >
                        Analysis
                      </LinkButton>
                      <button
                        onClick={() =>
                          handleExportPdf(
                            candidate.attemptId,
                            candidate.candidateName
                          )
                        }
                        disabled={exportingPdf === candidate.attemptId}
                        className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
                        title="Export PDF Report"
                      >
                        {exportingPdf === candidate.attemptId ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <Download className="mr-0.5 h-3 w-3" />
                            PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => toggle(candidate.attemptId)}
                        disabled={
                          !isSelected(candidate.attemptId) &&
                          selected.length >= 5
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
                      {isSuperAdmin && (
                        <button
                          onClick={() =>
                            handleDeleteAttempt(candidate.attemptId)
                          }
                          disabled={deletingAttemptId === candidate.attemptId}
                          className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                          title="Delete test attempt"
                        >
                          {deletingAttemptId === candidate.attemptId ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <>
                              <Trash2 className="mr-0.5 h-3 w-3" />
                              Delete
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination and Summary */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-700">
            <span className="font-medium">
              📊 Showing {Math.min(data.rows.length, data.pagination.pageSize)}{' '}
              of {data.pagination.total} candidates
              {data.pagination.totalPages > 1 &&
                ` • Page ${data.pagination.page} of ${data.pagination.totalPages}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {data.pagination.totalPages > 1 && onPageChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(data.pagination.page - 1)}
                  disabled={!data.pagination.hasPrevious}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="mr-1 h-3 w-3" />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const currentPage = data.pagination.page;
                    const totalPages = data.pagination.totalPages;
                    const pages: (number | string)[] = [];

                    if (totalPages <= 7) {
                      // Show all pages if 7 or less
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first, last, current and surrounding pages
                      pages.push(1);

                      if (currentPage > 3) {
                        pages.push('...');
                      }

                      for (
                        let i = Math.max(2, currentPage - 1);
                        i <= Math.min(totalPages - 1, currentPage + 1);
                        i++
                      ) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }

                      if (currentPage < totalPages - 2) {
                        pages.push('...');
                      }

                      pages.push(totalPages);
                    }

                    return pages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-xs text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }

                      const pageNum = page as number;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            currentPage === pageNum
                              ? 'bg-brand-600 text-white'
                              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                </div>

                <button
                  onClick={() => onPageChange(data.pagination.page + 1)}
                  disabled={!data.pagination.hasNext}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            )}
            <div className="border-l pl-2 text-xs text-gray-500">
              Results update instantly when changing weight profiles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
