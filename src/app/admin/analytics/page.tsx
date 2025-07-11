'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import InfoPanel from '@/components/ui/InfoPanel';
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  Building2,
  TestTube,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  code: string;
  description: string | null;
  level: string | null;
  isActive: boolean;
  testCount: number;
  activeTestCount: number;
}

interface PositionAnalytics {
  position: Position;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  topScore: number;
  averageTimeMinutes: number;
  recentAttempts: number; // Last 30 days
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  categoryAverages: {
    logical: number;
    verbal: number;
    numerical: number;
    attention: number;
    other: number;
  };
  monthlyTrends: {
    month: string;
    attempts: number;
    averageScore: number;
  }[];
  topPerformers: {
    candidateName: string;
    candidateEmail: string;
    score: number;
    completedAt: string;
    attemptId: string;
  }[];
}

interface OverallStats {
  totalPositions: number;
  totalCandidates: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  thisMonthAttempts: number;
  lastMonthAttempts: number;
  growthRate: number;
}

export default function PositionAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [analytics, setAnalytics] = useState<PositionAnalytics | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Auth check
  useEffect(() => {
    if (status === 'loading') return;
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/admin/positions?includeTestCount=true'
      );
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();

      // Only show active positions with tests
      const activePositionsWithTests = data.filter(
        (p: Position) => p.isActive && p.activeTestCount > 0
      );
      setPositions(activePositionsWithTests);

      // Select first position by default
      if (activePositionsWithTests.length > 0 && !selectedPositionId) {
        setSelectedPositionId(activePositionsWithTests[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch positions'
      );
    }
  }, [selectedPositionId]);

  // Fetch overall statistics
  const fetchOverallStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch overall statistics');
      const data = await response.json();
      setOverallStats(data);
    } catch (err) {
      console.error('Failed to fetch overall stats:', err);
    }
  }, []);

  // Fetch position analytics
  const fetchPositionAnalytics = useCallback(async () => {
    if (!selectedPositionId) return;

    setLoadingAnalytics(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/analytics/position/${selectedPositionId}`
      );
      if (!response.ok) throw new Error('Failed to fetch position analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch position analytics'
      );
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedPositionId]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPositions(), fetchOverallStats()]);
      setLoading(false);
    };

    if (session?.user) {
      loadData();
    }
  }, [session, fetchPositions, fetchOverallStats]);

  // Fetch analytics when position changes
  useEffect(() => {
    if (selectedPositionId) {
      fetchPositionAnalytics();
    }
  }, [selectedPositionId, fetchPositionAnalytics]);

  // Filter positions
  const filteredPositions = positions.filter((position) => {
    const matchesSearch =
      position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.description &&
        position.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });
  const selectedPosition = positions.find((p) => p.id === selectedPositionId);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Header - Compact */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-gray-900">
            Position Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            View detailed analytics and insights by job position
          </p>
        </div>

        {/* Info Panel */}
        <InfoPanel
          title="📈 Analytics Dashboard Guide"
          variant="success"
          dismissible={true}
        >
          <div className="space-y-2">
            <p>
              <strong>Available Analytics:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Overall performance statistics and growth rates</li>
              <li>Position-specific analytics with score distributions</li>
              <li>Category breakdowns (Logical, Verbal, Numerical, etc.)</li>
              <li>Monthly trends and top performers</li>
              <li>Detailed candidate performance analysis</li>
            </ul>
            <p className="text-sm font-medium text-green-700">
              💡 Tip: Use the detailed analysis links to get comprehensive
              insights!
            </p>
          </div>
        </InfoPanel>

        {/* Overall Stats Cards - Compact */}
        {overallStats && (
          <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Positions
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(overallStats.totalPositions)}
                  </p>
                </div>
                <div className="rounded-full bg-brand-100 p-2">
                  <Target className="h-4 w-4 text-brand-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Candidates
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatNumber(overallStats.totalCandidates)}
                  </p>
                </div>
                <div className="rounded-full bg-brand-100 p-2">
                  <Users className="h-4 w-4 text-brand-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Average Score
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {overallStats.averageScore.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-full bg-secondary-100 p-2">
                  <Award className="h-4 w-4 text-secondary-600" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Growth Rate
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {overallStats.growthRate > 0 ? '+' : ''}
                    {overallStats.growthRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">vs last month</p>
                </div>
                <div
                  className={`rounded-full p-2 ${
                    overallStats.growthRate >= 0 ? 'bg-brand-100' : 'bg-red-100'
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${
                      overallStats.growthRate >= 0
                        ? 'text-brand-600'
                        : 'text-red-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-4">
          {/* Position Selector Sidebar - Left Side */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Select Position
                </h2>
                <p className="text-xs text-gray-600">
                  Choose a position to view analytics
                </p>
              </div>

              {/* Search - Compact */}
              <div className="border-b border-gray-200 p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Positions List - Compact */}
              <div className="max-h-80 overflow-y-auto">
                {filteredPositions.length === 0 ? (
                  <div className="p-3 text-center">
                    <Target className="mx-auto h-6 w-6 text-gray-400" />
                    <p className="mt-1 text-xs text-gray-500">
                      {searchTerm
                        ? 'No positions match your search'
                        : 'No active positions with tests found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-1.5">
                    {filteredPositions.map((position) => (
                      <button
                        key={position.id}
                        onClick={() => setSelectedPositionId(position.id)}
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

          {/* Analytics Content - Middle and Right */}
          <div className="lg:col-span-3">
            {!selectedPosition ? (
              <div className="flex h-80 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a Position
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a position from the sidebar to view detailed
                    analytics
                  </p>
                </div>
              </div>
            ) : loadingAnalytics ? (
              <div className="flex h-80 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <div className="text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                  <p className="mt-3 text-sm text-gray-600">
                    Loading analytics...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-80 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <div className="text-center">
                  <div className="text-red-500">
                    <BarChart3 className="mx-auto h-10 w-10" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Error Loading Analytics
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{error}</p>
                  <button
                    onClick={fetchPositionAnalytics}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : analytics ? (
              <div className="space-y-3">
                {/* Position Header - Compact */}
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {selectedPosition.name} Analytics
                      </h2>
                      <p className="text-xs text-gray-600">
                        {selectedPosition.code}
                      </p>
                    </div>
                    <button
                      onClick={fetchPositionAnalytics}
                      className="rounded-md bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
                      title="Refresh analytics"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {/* Left Side - Key Metrics and Score Distribution */}
                  <div className="space-y-3 lg:col-span-2">
                    {/* Key Metrics - Compact */}
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Total Attempts
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {formatNumber(analytics.totalAttempts)}
                            </p>
                          </div>
                          <div className="rounded-full bg-brand-100 p-1.5">
                            <TestTube className="h-3 w-3 text-brand-600" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Average Score
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {analytics.averageScore.toFixed(1)}%
                            </p>
                          </div>
                          <div className="rounded-full bg-secondary-100 p-1.5">
                            <Award className="h-3 w-3 text-secondary-600" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Top Score
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {analytics.topScore.toFixed(1)}%
                            </p>
                          </div>
                          <div className="rounded-full bg-brand-100 p-1.5">
                            <Target className="h-3 w-3 text-brand-600" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Avg Time
                            </p>
                            <p className="text-base font-bold text-gray-900">
                              {formatDuration(analytics.averageTimeMinutes)}
                            </p>
                          </div>
                          <div className="rounded-full bg-secondary-100 p-1.5">
                            <Clock className="h-3 w-3 text-secondary-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score Distribution - Compact */}
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <h3 className="mb-2 text-sm font-semibold text-gray-900">
                        Score Distribution
                      </h3>
                      <div className="space-y-1.5">
                        {analytics.scoreDistribution.map((range, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-12 text-xs font-medium text-gray-700">
                              {range.range}
                            </div>
                            <div className="mx-2 flex-1">
                              <div className="h-2 rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-brand-500 transition-all duration-300"
                                  style={{ width: `${range.percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-14 text-right text-xs text-gray-600">
                              {range.count} ({range.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Performers - Compact */}
                    {analytics.topPerformers.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <h3 className="mb-2 text-sm font-semibold text-gray-900">
                          Top Performers
                        </h3>
                        <div className="space-y-1.5">
                          {analytics.topPerformers.map((performer, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg bg-gray-50 p-1.5"
                            >
                              <div className="flex items-center">
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                    index === 0
                                      ? 'bg-secondary-100 text-secondary-800'
                                      : index === 1
                                        ? 'bg-gray-100 text-gray-800'
                                        : index === 2
                                          ? 'bg-secondary-100 text-secondary-700'
                                          : 'bg-brand-100 text-brand-800'
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {performer.candidateName || 'Anonymous'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {performer.candidateEmail}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">
                                  {performer.score.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    performer.completedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Category Performance */}
                  <div className="lg:col-span-1">
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Category Performance
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(analytics.categoryAverages).map(
                          ([category, score]) => (
                            <div key={category} className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {score.toFixed(1)}%
                              </div>
                              <div className="text-xs font-medium capitalize text-gray-600">
                                {category === 'attention'
                                  ? 'Attention to Detail'
                                  : category}
                              </div>
                              <div className="mt-1 h-2 rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-brand-500 transition-all duration-300"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-lg border border-gray-200 bg-white">
                <div className="text-center">
                  <PieChart className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No Data Available
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    No test attempts found for this position yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
