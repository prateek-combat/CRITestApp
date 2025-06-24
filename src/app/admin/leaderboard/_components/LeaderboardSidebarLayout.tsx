'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LeaderboardTable from './LeaderboardTable';
import CompareDrawer from './CompareDrawer';
import WeightProfileSelector from './WeightProfileSelector';
import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Search,
  Filter,
  Building2,
  Target,
  TestTube,
} from 'lucide-react';
import { TableSkeleton } from '@/components/LoadingSkeleton';

interface Position {
  id: string;
  name: string;
  code: string;
  description: string | null;
  department: string | null;
  level: string | null;
  isActive: boolean;
  testCount: number;
  activeTestCount: number;
}

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

interface WeightProfile {
  id: string;
  name: string;
  description: string;
  weights: {
    LOGICAL: number;
    VERBAL: number;
    NUMERICAL: number;
    ATTENTION_TO_DETAIL: number;
    OTHER: number;
  };
  isDefault: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
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
  compositeUnweighted: number;
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
    dateFrom?: string;
    dateTo?: string;
    invitationId?: string;
    testId?: string;
    positionId?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
    weightProfile?: string;
  };
  weightProfile?: WeightProfile | null;
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

  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<WeightProfile[]>(
    []
  );
  const [customWeights, setCustomWeights] = useState<{
    LOGICAL: number;
    VERBAL: number;
    NUMERICAL: number;
    ATTENTION_TO_DETAIL: number;
    OTHER: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(
    urlSearchParams.get('search') || searchParamsProp.search || ''
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const router = useRouter();

  // Fetch weight profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/category-weights');
      if (response.ok) {
        const result = await response.json();
        // Extract the data array from the response
        const profiles = result.success ? result.data : [];
        setAvailableProfiles(profiles);
      } else {
        console.error(
          'Failed to fetch profiles:',
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error('Failed to fetch weight profiles:', err);
    }
  }, []);

  // Fetch positions for sidebar
  const fetchPositions = useCallback(async () => {
    setIsLoadingPositions(true);
    try {
      const response = await fetch(
        '/api/admin/positions?includeTestCount=true'
      );
      if (response.ok) {
        const positionsData = await response.json();
        // Only show active positions with tests
        const activePositionsWithTests = positionsData.filter(
          (p: Position) => p.isActive && p.activeTestCount > 0
        );
        setPositions(activePositionsWithTests);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, []); // Remove dependencies that change on every render

  // Fetch tests (for reference)
  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const testsData = await response.json();
        setTests(testsData);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(
    async (positionId?: string) => {
      const targetPositionId = positionId || selectedPositionId;
      if (!targetPositionId) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        // Always set positionId
        params.set('positionId', targetPositionId);

        // Add other search params
        urlSearchParams.forEach((value, key) => {
          if (key !== 'positionId' && value) {
            params.set(key, value);
          }
        });

        // Override pagination to get all results
        params.set('pageSize', '1000');
        params.delete('page');

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
    },
    [selectedPositionId, urlSearchParams]
  );

  // Initialize data fetch
  useEffect(() => {
    fetchPositions();
    fetchProfiles();
  }, [fetchPositions, fetchProfiles]);

  // Handle position selection from URL params
  useEffect(() => {
    const positionIdFromUrl = urlSearchParams.get('positionId');
    if (positionIdFromUrl && positionIdFromUrl !== selectedPositionId) {
      setSelectedPositionId(positionIdFromUrl);
    } else if (
      !positionIdFromUrl &&
      positions.length > 0 &&
      !selectedPositionId
    ) {
      // Auto-select first position if none selected
      setSelectedPositionId(positions[0].id);
    }
  }, [urlSearchParams, positions, selectedPositionId]);

  // Fetch data when position changes
  useEffect(() => {
    if (selectedPositionId) {
      fetchLeaderboardData(selectedPositionId);
    }
  }, [selectedPositionId, fetchLeaderboardData]);

  // Filter positions based on search and department
  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesSearch =
        position.name.toLowerCase().includes(localSearch.toLowerCase()) ||
        position.code.toLowerCase().includes(localSearch.toLowerCase()) ||
        (position.description &&
          position.description
            .toLowerCase()
            .includes(localSearch.toLowerCase()));

      const matchesDepartment =
        departmentFilter === 'all' || position.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [positions, localSearch, departmentFilter]);

  // Get unique departments
  const departments = useMemo(() => {
    return [...new Set(positions.map((p) => p.department).filter(Boolean))];
  }, [positions]);

  // Get selected position
  const selectedPosition = useMemo(() => {
    return positions.find((p) => p.id === selectedPositionId);
  }, [positions, selectedPositionId]);

  const handlePositionSelect = (positionId: string) => {
    setSelectedPositionId(positionId);

    // Update URL
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('positionId', positionId);
    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleFilterChange = (
    newFilters: Record<string, string | undefined>
  ) => {
    const params = new URLSearchParams(urlSearchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ search: localSearch });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setDepartmentFilter('all');
    handleFilterChange({ search: undefined });
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ page: page.toString() });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    handleFilterChange({ sortBy, sortOrder });
  };

  const handleWeightProfileChange = (profileId: string | null) => {
    handleFilterChange({
      weightProfile: profileId || undefined,
    });
  };

  const handleCustomWeightsChange = (weights: {
    LOGICAL: number;
    VERBAL: number;
    NUMERICAL: number;
    ATTENTION_TO_DETAIL: number;
    OTHER: number;
  }) => {
    setCustomWeights(weights);

    // Convert weights to URL params
    const weightParams: Record<string, string> = {};
    Object.entries(weights).forEach(([key, value]) => {
      weightParams[`weight_${key}`] = value.toString();
    });

    handleFilterChange(weightParams);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3">
      {/* Left Sidebar - Position Selector */}
      <div className="w-80 flex-shrink-0">
        <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-3">
            <h2 className="text-base font-semibold text-gray-900">
              Select Position
            </h2>
            <p className="text-xs text-gray-600">
              Select a position to view candidate rankings
            </p>
          </div>

          {/* Search and Filters - Compact */}
          <div className="space-y-2 border-b border-gray-200 p-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search positions..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </form>

            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-gray-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept || 'unknown'} value={dept || ''}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {(localSearch || departmentFilter !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-brand-600 hover:text-brand-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Positions List - Compact */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingPositions ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-brand-500"></div>
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="p-3 text-center">
                <Users className="mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-1 text-xs text-gray-500">
                  {localSearch || departmentFilter !== 'all'
                    ? 'No positions match your filters'
                    : 'No active positions with tests found'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-1.5">
                {filteredPositions.map((position) => (
                  <button
                    key={position.id}
                    onClick={() => handlePositionSelect(position.id)}
                    className={`w-full rounded-lg border p-2 text-left transition-colors ${
                      selectedPositionId === position.id
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {position.name}
                        </h3>
                        <p className="font-mono text-xs text-gray-500">
                          {position.code}
                        </p>
                        {position.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                            {position.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-medium text-brand-600">
                            {position.activeTestCount}
                          </div>
                          <div className="text-xs text-gray-500">tests</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1">
                      {position.department && (
                        <span className="inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                          <Building2 className="mr-1 h-2.5 w-2.5" />
                          {position.department}
                        </span>
                      )}
                      {position.level && (
                        <span className="inline-flex items-center rounded-md bg-secondary-50 px-1.5 py-0.5 text-xs font-medium text-secondary-700">
                          <Target className="mr-1 h-2.5 w-2.5" />
                          {position.level}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 gap-3">
        {/* Center - Leaderboard Table */}
        <div className="flex flex-1 flex-col">
          {/* Header - Compact */}
          <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                {selectedPosition ? (
                  <div>
                    <h1 className="text-base font-semibold text-gray-900">
                      {selectedPosition.name} Leaderboard
                    </h1>
                    <p className="text-xs text-gray-600">
                      Rankings for {selectedPosition.name} (
                      {selectedPosition.code}) position
                    </p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-base font-semibold text-gray-900">
                      Position Leaderboard
                    </h1>
                    <p className="text-xs text-gray-600">
                      Select a position to view candidate rankings
                    </p>
                  </div>
                )}
              </div>

              {selectedPosition && data && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-brand-600">
                      {data.stats.totalCandidates || 0}
                    </div>
                    <div className="text-xs text-gray-500">candidates</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-secondary-600">
                      {data.stats.avgScore?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-gray-500">avg score</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {!selectedPosition ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Trophy className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a Position
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a position from the sidebar to view the leaderboard
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-red-500">
                    <TrendingUp className="mx-auto h-10 w-10" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Error Loading Data
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{error}</p>
                  <button
                    onClick={() => fetchLeaderboardData()}
                    className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !data || data.rows.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No Candidates Found
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    No test attempts found for this position yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <LeaderboardTable
                  data={data}
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Weight Profile Selector */}
        <div className="w-80 flex-shrink-0">
          {selectedPosition && (
            <WeightProfileSelector
              availableProfiles={availableProfiles}
              currentProfile={data?.weightProfile || null}
              onProfileChange={handleWeightProfileChange}
              onCustomWeightsChange={handleCustomWeightsChange}
            />
          )}
        </div>
      </div>

      {/* Compare Drawer */}
      <CompareDrawer />
    </div>
  );
}
