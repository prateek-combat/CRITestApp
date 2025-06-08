'use client';

import { useState, useEffect } from 'react';
import { useCompareStore } from '@/lib/compareStore';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load the radar chart to avoid SSR issues
const RadarCompare = dynamic(() => import('./RadarCompare'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface CandidateScore {
  attemptId: string;
  candidateName: string;
  candidateEmail: string;
  composite: number;
  scoreLogical: number;
  scoreVerbal: number;
  scoreNumerical: number;
  scoreAttention: number;
  percentile: number;
  rank: number;
  durationSeconds: number;
}

export default function CompareDrawer() {
  const { selected, isComparing, clear, stopCompare } = useCompareStore();
  const [candidates, setCandidates] = useState<CandidateScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = isComparing && selected.length >= 2;

  useEffect(() => {
    if (!isOpen || selected.length === 0) {
      setCandidates([]);
      return;
    }

    const fetchCandidates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/compare', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selected }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch comparison data');
        }

        const data = await response.json();
        setCandidates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [isOpen, selected]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={() => {
          stopCompare();
          clear();
        }}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-4xl overflow-y-auto bg-white shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Compare Candidates
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Side-by-side performance comparison for {selected.length}{' '}
                candidate{selected.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                stopCompare();
                clear();
              }}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Loading comparison data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700">
              <div className="flex">
                <div className="py-1">
                  <svg
                    className="mr-3 h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error Loading Comparison</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && candidates.length > 0 && (
            <div className="space-y-8">
              {/* Radar Chart */}
              <div className="rounded-lg bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Performance Comparison
                </h3>
                <RadarCompare candidates={candidates} />
              </div>

              {/* Summary Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detailed Comparison
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Metric
                        </th>
                        {candidates.map((candidate) => (
                          <th
                            key={candidate.attemptId}
                            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                          >
                            <div className="text-sm font-medium normal-case text-gray-900">
                              {candidate.candidateName}
                            </div>
                            <div className="text-xs normal-case text-gray-500">
                              Rank #{candidate.rank}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Composite Score
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center"
                          >
                            <div className="text-lg font-bold text-gray-900">
                              {candidate.composite.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {candidate.percentile.toFixed(1)}th percentile
                            </div>
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Logical Reasoning
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900"
                          >
                            {candidate.scoreLogical.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Verbal Reasoning
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900"
                          >
                            {candidate.scoreVerbal.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Numerical Reasoning
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900"
                          >
                            {candidate.scoreNumerical.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Attention to Detail
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900"
                          >
                            {candidate.scoreAttention.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          Test Duration
                        </td>
                        {candidates.map((candidate) => (
                          <td
                            key={candidate.attemptId}
                            className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900"
                          >
                            {formatDuration(candidate.durationSeconds)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  You can select up to 5 candidates for comparison
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={clear}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
