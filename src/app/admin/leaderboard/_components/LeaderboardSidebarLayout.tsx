'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LeaderboardTable from './LeaderboardTable';
import CompareDrawer from './CompareDrawer';
import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Search,
  Filter,
} from 'lucide-react';
import { TableSkeleton } from '@/components/LoadingSkeleton';

interface Test {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  _count?: {
    TestAttempt: number;
    PublicTestAttempt: number;
  };
}

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

interface LeaderboardSidebarLayoutProps {
  searchParams?: Record<string, string | undefined>;
}

export default function LeaderboardSidebarLayout({
  searchParams: searchParamsProp = {},
}: LeaderboardSidebarLayoutProps) {
  // Use useSearchParams to get current URL search params
  const urlSearchParams = useSearchParams();

  // Memoize searchParams to prevent infinite re-renders
  const searchParams = useMemo(
    () => ({
      testId:
        urlSearchParams.get('testId') || searchParamsProp.testId || undefined,
      page: urlSearchParams.get('page') || searchParamsProp.page || undefined,
      pageSize:
        urlSearchParams.get('pageSize') ||
        searchParamsProp.pageSize ||
        undefined,
      dateFrom:
        urlSearchParams.get('dateFrom') ||
        searchParamsProp.dateFrom ||
        undefined,
      dateTo:
        urlSearchParams.get('dateTo') || searchParamsProp.dateTo || undefined,
      invitationId:
        urlSearchParams.get('invitationId') ||
        searchParamsProp.invitationId ||
        undefined,
      search:
        urlSearchParams.get('search') || searchParamsProp.search || undefined,
      sortBy:
        urlSearchParams.get('sortBy') || searchParamsProp.sortBy || undefined,
      sortOrder:
        urlSearchParams.get('sortOrder') ||
        searchParamsProp.sortOrder ||
        undefined,
    }),
    [urlSearchParams, searchParamsProp]
  );

  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchParams.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const router = useRouter();

  // Fetch tests for sidebar
  const fetchTests = useCallback(async () => {
    setIsLoadingTests(true);
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);

        // Set default selected test to the latest test or from searchParams
        if (searchParams.testId) {
          setSelectedTestId(searchParams.testId);
        } else if (testsData.length > 0) {
          // Sort by createdAt and select the latest
          const sortedTests = testsData.sort(
            (a: Test, b: Test) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSelectedTestId(sortedTests[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoadingTests(false);
    }
  }, [searchParams.testId]);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(async () => {
    if (!selectedTestId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      // Always include the selected test ID
      params.set('testId', selectedTestId);

      // Add other search params
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value && key !== 'testId') {
          params.set(key, value);
        }
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
  }, [
    selectedTestId,
    searchParams.search,
    searchParams.page,
    searchParams.pageSize,
    searchParams.dateFrom,
    searchParams.dateTo,
    searchParams.invitationId,
    searchParams.sortBy,
    searchParams.sortOrder,
  ]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  useEffect(() => {
    if (selectedTestId) {
      fetchLeaderboardData();
    }
  }, [selectedTestId, fetchLeaderboardData]);

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId);
    // Update URL with new testId
    const params = new URLSearchParams();
    params.set('testId', testId);

    // Keep other existing params except page (reset to 1)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'testId' && key !== 'page') {
        params.set(key, value);
      }
    });
    params.set('page', '1');

    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleFilterChange = (
    newFilters: Record<string, string | undefined>
  ) => {
    const params = new URLSearchParams();

    // Always preserve the selected test
    if (selectedTestId) {
      params.set('testId', selectedTestId);
    }

    // Merge current search params with new filters
    Object.entries({ ...searchParams, ...newFilters }).forEach(
      ([key, value]) => {
        if (value && value !== '' && key !== 'testId') {
          params.set(key, value);
        }
      }
    );

    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ search: localSearch || undefined, page: '1' });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    handleFilterChange({
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      invitationId: undefined,
      page: '1',
    });
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ page: page.toString() });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    handleFilterChange({ sortBy, sortOrder, page: '1' });
  };

  const hasActiveFilters =
    searchParams.search ||
    searchParams.dateFrom ||
    searchParams.dateTo ||
    searchParams.invitationId;

  const selectedTest = tests.find((test) => test.id === selectedTestId);

  if (isLoadingTests) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] gap-6">
      {/* Sidebar */}
      <div className="sticky top-0 w-64 flex-shrink-0 self-start overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Tests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a test to view its leaderboard
          </p>
        </div>

        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {tests.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Trophy className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p>No tests available</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => handleTestSelect(test.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedTestId === test.id
                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{test.title}</h3>
                      {test.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {test.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedTestId === test.id && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {selectedTest && (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTest.title}
                </h2>
                {selectedTest.description && (
                  <p className="mt-1 text-gray-600">
                    {selectedTest.description}
                  </p>
                )}
              </div>

              {data?.stats && (
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="mr-1 h-4 w-4" />
                    {data.stats.totalCandidates} candidates
                  </div>
                  <div className="flex items-center text-gray-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    {data.stats.avgScore}% avg score
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Trophy className="mr-1 h-4 w-4" />
                    {data.stats.topScore}% top score
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-4">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by candidate name or email..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
              </form>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Date From */}
                    <div>
                      <label
                        htmlFor="dateFrom"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Completed From
                      </label>
                      <input
                        type="date"
                        id="dateFrom"
                        value={searchParams.dateFrom || ''}
                        onChange={(e) =>
                          handleFilterChange({
                            dateFrom: e.target.value || undefined,
                            page: '1',
                          })
                        }
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 leading-5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label
                        htmlFor="dateTo"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Completed To
                      </label>
                      <input
                        type="date"
                        id="dateTo"
                        value={searchParams.dateTo || ''}
                        onChange={(e) =>
                          handleFilterChange({
                            dateTo: e.target.value || undefined,
                            page: '1',
                          })
                        }
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 leading-5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-500">
                      {hasActiveFilters ? (
                        <span>Active filters applied</span>
                      ) : (
                        <span>No filters applied</span>
                      )}
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-blue-600 underline hover:text-blue-700"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {isLoading ? (
          <div className="rounded-lg bg-white p-6 shadow">
            <TableSkeleton rows={10} columns={8} />
          </div>
        ) : error ? (
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
                  onClick={fetchLeaderboardData}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : !data ? (
          <div className="rounded-lg bg-white py-8 text-center shadow">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No leaderboard data available</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <LeaderboardTable
              data={data}
              onPageChange={handlePageChange}
              onSort={handleSort}
            />
          </div>
        )}

        <CompareDrawer />
      </div>
    </div>
  );
}
