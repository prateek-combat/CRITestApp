'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LeaderboardTable from './LeaderboardTable';
import LeaderboardFilters from './LeaderboardFilters';
import CompareDrawer from './CompareDrawer';

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
  composite: number;
  percentile: number;
  rank: number;
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
    dateFrom?: string;
    dateTo?: string;
    invitationId?: string;
    testId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  };
  stats: {
    totalCandidates: number;
    avgScore: number;
    topScore: number;
    thisMonth: number;
  };
}

interface LeaderboardContentProps {
  searchParams: Record<string, string | undefined>;
}

export default function LeaderboardContent({
  searchParams,
}: LeaderboardContentProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/admin/leaderboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (
    newFilters: Record<string, string | undefined>
  ) => {
    const params = new URLSearchParams();

    // Merge current search params with new filters
    Object.entries({ ...searchParams, ...newFilters }).forEach(
      ([key, value]) => {
        if (value && value !== '') {
          params.set(key, value);
        }
      }
    );

    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ page: page.toString() });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    handleFilterChange({ sortBy, sortOrder, page: '1' }); // Reset to first page
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
        <p className="ml-3 text-gray-600">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700">
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
            <p className="font-bold">Error Loading Leaderboard</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LeaderboardFilters
        filters={data.filters}
        onFilterChange={handleFilterChange}
        stats={data.stats}
      />

      <LeaderboardTable
        data={data}
        onPageChange={handlePageChange}
        onSort={handleSort}
      />

      <CompareDrawer />
    </div>
  );
}
