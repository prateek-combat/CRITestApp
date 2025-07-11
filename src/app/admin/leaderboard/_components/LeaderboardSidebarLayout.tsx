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
  Download,
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

interface JobProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  positions?: Position[];
  testWeights?: Array<{
    id: string;
    testId: string;
    weight: number;
    test: {
      id: string;
      title: string;
      description: string | null;
      questionsCount?: number;
      isArchived?: boolean;
    };
  }>;
  _count: {
    invitations: number;
    completedInvitations?: number;
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
  userRole?: string;
}

export default function LeaderboardSidebarLayout({
  searchParams: searchParamsProp = {},
  userRole,
}: LeaderboardSidebarLayoutProps) {
  // Use useSearchParams to get current URL search params
  const urlSearchParams = useSearchParams();

  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [selectedJobProfileId, setSelectedJobProfileId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'position' | 'jobProfile'>(
    'jobProfile'
  );
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

  // NEW: State for right sidebar visibility
  const [isWeightsSidebarOpen, setIsWeightsSidebarOpen] = useState(true);
  const [isExportingBulkPdf, setIsExportingBulkPdf] = useState(false);

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

  // Fetch job profiles
  const fetchJobProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/job-profiles');
      if (response.ok) {
        const jobProfilesData = await response.json();
        setJobProfiles(jobProfilesData);
      }
    } catch (error) {
      console.error('Error fetching job profiles:', error);
    }
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(
    async (positionId?: string, jobProfileId?: string) => {
      const targetPositionId = positionId || selectedPositionId;
      const targetJobProfileId = jobProfileId || selectedJobProfileId;

      if (!targetPositionId && !targetJobProfileId) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        // Set either positionId or jobProfileId based on view mode
        if (viewMode === 'jobProfile' && targetJobProfileId) {
          params.set('jobProfileId', targetJobProfileId);
        } else if (targetPositionId) {
          params.set('positionId', targetPositionId);
        }

        // Add other search params
        urlSearchParams.forEach((value, key) => {
          if (key !== 'positionId' && key !== 'jobProfileId' && value) {
            params.set(key, value);
          }
        });

        // Set default page size if not provided
        if (!params.has('pageSize')) {
          params.set('pageSize', '50'); // Default to 50 items per page
        }
        if (!params.has('page')) {
          params.set('page', '1');
        }

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
    [selectedPositionId, selectedJobProfileId, viewMode, urlSearchParams]
  );

  // Initialize data fetch
  useEffect(() => {
    fetchPositions();
    fetchProfiles();
    fetchJobProfiles();
  }, [fetchPositions, fetchProfiles, fetchJobProfiles]);

  // Handle job profile selection from URL params
  useEffect(() => {
    const jobProfileIdFromUrl = urlSearchParams.get('jobProfileId');
    if (jobProfileIdFromUrl && jobProfileIdFromUrl !== selectedJobProfileId) {
      setSelectedJobProfileId(jobProfileIdFromUrl);
    } else if (
      !jobProfileIdFromUrl &&
      jobProfiles.length > 0 &&
      !selectedJobProfileId
    ) {
      // Auto-select first active job profile if none selected
      const firstActiveProfile = jobProfiles.find((p) => p.isActive);
      if (firstActiveProfile) {
        setSelectedJobProfileId(firstActiveProfile.id);
      }
    }
  }, [urlSearchParams, jobProfiles, selectedJobProfileId]);

  // Fetch data when position or job profile changes
  useEffect(() => {
    if (viewMode === 'position' && selectedPositionId) {
      fetchLeaderboardData(selectedPositionId, undefined);
    } else if (viewMode === 'jobProfile' && selectedJobProfileId) {
      fetchLeaderboardData(undefined, selectedJobProfileId);
    }
  }, [
    selectedPositionId,
    selectedJobProfileId,
    viewMode,
    fetchLeaderboardData,
  ]);

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

  // Get selected job profile
  const selectedJobProfile = useMemo(() => {
    return jobProfiles.find((p) => p.id === selectedJobProfileId);
  }, [jobProfiles, selectedJobProfileId]);

  const handlePositionSelect = (positionId: string) => {
    setSelectedPositionId(positionId);
    setViewMode('position');

    // Update URL
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('positionId', positionId);
    params.delete('jobProfileId');
    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleJobProfileSelect = (jobProfileId: string) => {
    setSelectedJobProfileId(jobProfileId);
    setViewMode('jobProfile');

    // Update URL
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('jobProfileId', jobProfileId);
    params.delete('positionId');
    router.push(`/admin/leaderboard?${params.toString()}`);
  };

  const handleViewModeChange = (mode: 'position' | 'jobProfile') => {
    setViewMode(mode);
    if (mode === 'position' && selectedPositionId) {
      handlePositionSelect(selectedPositionId);
    } else if (mode === 'jobProfile' && selectedJobProfileId) {
      handleJobProfileSelect(selectedJobProfileId);
    }
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

  const handleBulkExportPdf = async () => {
    if (!data || !data.rows.length) {
      alert('No data available to export');
      return;
    }

    try {
      setIsExportingBulkPdf(true);

      const attemptIds = data.rows.map((row) => row.attemptId);
      const positionName = selectedJobProfile?.name;

      const response = await fetch('/api/admin/leaderboard/export-bulk-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptIds,
          positionName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bulk PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const filename = positionName
        ? `${positionName.replace(/[^a-zA-Z0-9]/g, '_')}_comparison.pdf`
        : `test_comparison_${new Date().toISOString().split('T')[0]}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting bulk PDF:', error);
      alert('Failed to export bulk PDF. Please try again.');
    } finally {
      setIsExportingBulkPdf(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3">
      {/* Left Sidebar - Position Selector */}
      <div className="w-80 flex-shrink-0">
        <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-3">
            <h2 className="text-base font-semibold text-gray-900">
              Select Job Profile
            </h2>
            <p className="text-xs text-gray-600">
              Select a job profile to view candidate rankings
            </p>
          </div>

          {/* Search and Filters - Compact */}
          <div className="space-y-2 border-b border-gray-200 p-2">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search job profiles..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </form>

            {localSearch && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-brand-600 hover:text-brand-800"
              >
                Clear search
              </button>
            )}
          </div>

          {/* Job Profiles List - Compact */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingPositions ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-brand-500"></div>
              </div>
            ) : jobProfiles.filter((profile) => profile.isActive).length ===
              0 ? (
              <div className="p-3 text-center">
                <Users className="mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-1 text-xs text-gray-500">
                  {localSearch
                    ? 'No job profiles match your search'
                    : 'No active job profiles found'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-1.5">
                {jobProfiles
                  .filter((profile) => profile.isActive)
                  .filter(
                    (profile) =>
                      !localSearch ||
                      profile.name
                        .toLowerCase()
                        .includes(localSearch.toLowerCase()) ||
                      (profile.description &&
                        profile.description
                          .toLowerCase()
                          .includes(localSearch.toLowerCase()))
                  )
                  .map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleJobProfileSelect(profile.id)}
                      className={`w-full rounded-lg border p-2 text-left transition-colors ${
                        selectedJobProfileId === profile.id
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium">
                            {profile.name}
                          </h3>
                          {profile.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                              {profile.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-medium text-brand-600">
                              {profile._count.completedInvitations ||
                                profile._count.invitations ||
                                0}
                            </div>
                            <div className="text-xs text-gray-500">
                              completed
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-1">
                        {profile.positions &&
                        Array.isArray(profile.positions) &&
                        profile.positions.length > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                            <Building2 className="mr-1 h-2.5 w-2.5" />
                            {profile.positions.length} position
                            {profile.positions.length > 1 ? 's' : ''}
                          </span>
                        ) : null}
                        {profile.testWeights &&
                        Array.isArray(profile.testWeights) &&
                        profile.testWeights.length > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-secondary-50 px-1.5 py-0.5 text-xs font-medium text-secondary-700">
                            <TestTube className="mr-1 h-2.5 w-2.5" />
                            {profile.testWeights.length} test
                            {profile.testWeights.length > 1 ? 's' : ''}
                          </span>
                        ) : null}
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
                {selectedJobProfile ? (
                  <div>
                    <h1 className="text-base font-semibold text-gray-900">
                      {selectedJobProfile.name} Leaderboard
                    </h1>
                    <p className="text-xs text-gray-600">
                      Rankings for {selectedJobProfile.name} job profile
                    </p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-base font-semibold text-gray-900">
                      Job Profile Leaderboard
                    </h1>
                    <p className="text-xs text-gray-600">
                      Select a job profile to view candidate rankings
                    </p>
                  </div>
                )}
              </div>

              {selectedJobProfile && data && (
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
                  <button
                    onClick={handleBulkExportPdf}
                    disabled={isExportingBulkPdf || !data.rows.length}
                    className="inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                    title={`Export comparison view showing who answered what for each question`}
                  >
                    {isExportingBulkPdf ? (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent"></span>
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isExportingBulkPdf
                      ? 'Generating...'
                      : 'Export Comparison PDF'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {!selectedJobProfile ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Trophy className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a Job Profile
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a job profile from the sidebar to view the
                    leaderboard
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
                    No test attempts found for this job profile yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <LeaderboardTable
                  data={data}
                  onSort={handleSort}
                  onPageChange={handlePageChange}
                  userRole={userRole}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Weight Profile Selector */}
        <aside
          className={`flex-shrink-0 transition-all duration-300 ${
            isWeightsSidebarOpen ? 'w-80' : 'w-16'
          }`}
        >
          {selectedJobProfile && (
            <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 p-3">
                {isWeightsSidebarOpen && (
                  <h2 className="text-sm font-semibold text-gray-900">
                    Category Weights
                  </h2>
                )}
                <button
                  onClick={() => setIsWeightsSidebarOpen(!isWeightsSidebarOpen)}
                  className="text-gray-500 hover:text-gray-800"
                  title={isWeightsSidebarOpen ? 'Collapse' : 'Expand'}
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
              <div
                className={`flex-1 overflow-auto p-3 ${
                  !isWeightsSidebarOpen && 'hidden'
                }`}
              >
                <WeightProfileSelector
                  availableProfiles={availableProfiles}
                  currentProfile={data?.weightProfile || null}
                  onProfileChange={handleWeightProfileChange}
                  onCustomWeightsChange={handleCustomWeightsChange}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Compare Drawer */}
      <CompareDrawer />
    </div>
  );
}
