'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuestionCategory } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';

interface CategoryScoreDetail {
  correct: number;
  total: number;
  score: number;
}

interface TestAttemptAnalytics {
  id: string;
  testId: string;
  testTitle: string;
  candidateName: string | null;
  candidateEmail: string | null;
  completedAt: string | null;
  status: string;
  rawScore: number | null;
  percentile: number | null;
  durationSeconds: number | null;
  categoryScores: Record<QuestionCategory, CategoryScoreDetail>;
  tabSwitches: number;
  ipAddress: string | null;
  totalQuestions: number;
  correctAnswers: number;
  creatorEmail: string | null;
}

interface TestSummary {
  testId: string;
  testTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  avgScore: number;
  avgDuration: number;
  topScore: number;
  completionRate: number;
  candidates: TestAttemptAnalytics[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [analytics, setAnalytics] = useState<TestAttemptAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('30');
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'tests' | 'candidates'>(
    'overview'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TestAttemptAnalytics[]>(
    []
  );
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics/test-attempts');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalytics(Array.isArray(data) ? data : data ? [data] : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  // Live search functionality with debouncing
  useEffect(() => {
    const performSearch = () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const query = searchQuery.toLowerCase();
      const results = analytics.filter(
        (attempt) =>
          attempt.candidateName?.toLowerCase().includes(query) ||
          attempt.candidateEmail?.toLowerCase().includes(query)
      );

      setSearchResults(results);
      setShowSearchResults(true);
      setViewMode('candidates');
      setIsSearching(false);
    };

    // Debounce the search to avoid too many searches while typing
    const timeoutId = setTimeout(performSearch, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, analytics]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
  };

  // Filter data based on selected timeframe
  const filteredAnalytics = useMemo(() => {
    if (!selectedTimeFrame || selectedTimeFrame === 'all') return analytics;

    const daysAgo = parseInt(selectedTimeFrame);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    return analytics.filter((attempt) => {
      if (!attempt.completedAt) return false;
      return new Date(attempt.completedAt) >= cutoffDate;
    });
  }, [analytics, selectedTimeFrame]);

  // Group data by tests
  const testSummaries = useMemo((): TestSummary[] => {
    const testGroups: Record<string, TestAttemptAnalytics[]> = {};

    filteredAnalytics.forEach((attempt) => {
      if (!testGroups[attempt.testId]) {
        testGroups[attempt.testId] = [];
      }
      testGroups[attempt.testId].push(attempt);
    });

    return Object.entries(testGroups)
      .map(([testId, attempts]) => {
        const completed = attempts.filter((a) => a.status === 'COMPLETED');
        const avgScore =
          completed.length > 0
            ? completed.reduce((sum, a) => sum + (a.rawScore || 0), 0) /
              completed.length
            : 0;
        const avgDuration =
          completed.length > 0
            ? completed.reduce((sum, a) => sum + (a.durationSeconds || 0), 0) /
              completed.length
            : 0;
        const topScore =
          completed.length > 0
            ? Math.max(...completed.map((a) => a.rawScore || 0))
            : 0;

        return {
          testId,
          testTitle: attempts[0]?.testTitle || 'Unknown Test',
          totalAttempts: attempts.length,
          completedAttempts: completed.length,
          avgScore: Math.round(avgScore * 100) / 100,
          avgDuration: Math.round(avgDuration / 60), // Convert to minutes
          topScore,
          completionRate: Math.round(
            (completed.length / attempts.length) * 100
          ),
          candidates: attempts.sort(
            (a, b) => (b.rawScore || 0) - (a.rawScore || 0)
          ),
        };
      })
      .sort((a, b) => b.totalAttempts - a.totalAttempts);
  }, [filteredAnalytics]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const completed = filteredAnalytics.filter((a) => a.status === 'COMPLETED');
    const totalCandidates = new Set(
      filteredAnalytics.map((a) => a.candidateEmail)
    ).size;

    return {
      totalTests: testSummaries.length,
      totalCandidates,
      totalAttempts: filteredAnalytics.length,
      completedAttempts: completed.length,
      avgScore:
        completed.length > 0
          ? completed.reduce((sum, a) => sum + (a.rawScore || 0), 0) /
            completed.length
          : 0,
      avgDuration:
        completed.length > 0
          ? completed.reduce((sum, a) => sum + (a.durationSeconds || 0), 0) /
            completed.length /
            60
          : 0,
    };
  }, [filteredAnalytics, testSummaries]);

  // Performance distribution data
  const performanceDistribution = useMemo(() => {
    const ranges = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '21-40%', min: 21, max: 40, count: 0 },
      { range: '41-60%', min: 41, max: 60, count: 0 },
      { range: '61-80%', min: 61, max: 80, count: 0 },
      { range: '81-100%', min: 81, max: 100, count: 0 },
    ];

    filteredAnalytics
      .filter((a) => a.status === 'COMPLETED' && a.rawScore !== null)
      .forEach((attempt) => {
        const percentage = Math.round(
          ((attempt.rawScore || 0) / attempt.totalQuestions) * 100
        );
        ranges.forEach((range) => {
          if (percentage >= range.min && percentage <= range.max) {
            range.count++;
          }
        });
      });

    return ranges;
  }, [filteredAnalytics]);

  // Test difficulty analysis
  const testDifficultyData = useMemo(() => {
    return testSummaries.map((test) => ({
      testTitle:
        test.testTitle.length > 20
          ? test.testTitle.substring(0, 20) + '...'
          : test.testTitle,
      avgScore: test.avgScore,
      completionRate: test.completionRate,
      attempts: test.totalAttempts,
    }));
  }, [testSummaries]);

  // Category performance across all tests
  const categoryPerformance = useMemo(() => {
    const categories: Record<string, { total: number; correct: number }> = {};

    filteredAnalytics.forEach((attempt) => {
      Object.entries(attempt.categoryScores).forEach(([category, score]) => {
        if (!categories[category]) {
          categories[category] = { total: 0, correct: 0 };
        }
        categories[category].total += score.total;
        categories[category].correct += score.correct;
      });
    });

    return Object.entries(categories).map(([category, data]) => ({
      category: category.replace(/_/g, ' '),
      accuracy:
        data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      totalQuestions: data.total,
    }));
  }, [filteredAnalytics]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
        <p className="ml-4 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hiring Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Insights into test performance and candidate evaluation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeFrame}
            onChange={(e) => setSelectedTimeFrame(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-150 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Live Search Bar */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Type to search candidates by name or email..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pl-10 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-b border-primary-500"></div>
                ) : (
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        {showSearchResults && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isSearching ? (
                <span className="flex items-center">
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-b border-primary-500"></div>
                  Searching...
                </span>
              ) : (
                <span>
                  Found{' '}
                  <span className="font-medium text-primary-600">
                    {searchResults.length}
                  </span>{' '}
                  result{searchResults.length !== 1 ? 's' : ''} for "
                  {searchQuery}"
                </span>
              )}
            </div>
            {!isSearching && (
              <button
                onClick={() => setViewMode('candidates')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View all results
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-500"></div>
          <p className="ml-3 text-sm text-gray-600">Loading analytics...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="mb-6 rounded-md border-l-4 border-red-400 bg-red-50 p-4"
          role="alert"
        >
          <div className="flex">
            <div className="py-1">
              <svg
                className="mr-3 h-5 w-5 text-red-400"
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
              <p className="text-sm font-medium text-red-800">
                Error Loading Data
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAnalytics.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No test data found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            No test attempts found in the selected time frame.
          </p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && filteredAnalytics.length > 0 && (
        <div className="space-y-6">
          {/* View Mode Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'tests', label: 'By Test', icon: '📝' },
                { key: 'candidates', label: 'By Candidate', icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key as any)}
                  className={`flex items-center space-x-2 border-b-2 px-1 py-2 text-sm font-medium ${
                    viewMode === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === 'candidates' && showSearchResults && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                      {searchResults.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                        <span className="text-sm text-white">📝</span>
                      </div>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-500">
                        Active Tests
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {overallStats.totalTests}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                        <span className="text-sm text-white">👥</span>
                      </div>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-500">
                        Candidates
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {overallStats.totalCandidates}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
                        <span className="text-sm text-white">📈</span>
                      </div>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-500">
                        Avg Score
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {overallStats.avgScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-800">
                        <span className="text-sm text-white">⏱️</span>
                      </div>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-500">
                        Avg Duration
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {Math.round(overallStats.avgDuration)}m
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Category Performance */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Skill Performance
                  </h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={categoryPerformance} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                          stroke="#64748b"
                        />
                        <YAxis
                          dataKey="category"
                          type="category"
                          width={100}
                          tick={{ fontSize: 11 }}
                          stroke="#64748b"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`${value}%`, 'Accuracy']}
                        />
                        <Bar
                          dataKey="accuracy"
                          fill="#4A5D23"
                          radius={[0, 2, 2, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Test Performance Distribution */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">
                    Test Performance
                  </h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={testSummaries.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="testTitle"
                          tick={{ fontSize: 10 }}
                          stroke="#64748b"
                        />
                        <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="avgScore"
                          fill="#4A5D23"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Performance Distribution */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    📊 Score Distribution
                  </h3>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`${value} candidates`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Test Difficulty Analysis */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    🎯 Test Difficulty Analysis
                  </h3>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={testDifficultyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="avgScore"
                        type="number"
                        domain={[0, 100]}
                        name="Average Score (%)"
                      />
                      <YAxis
                        dataKey="completionRate"
                        type="number"
                        domain={[0, 100]}
                        name="Completion Rate (%)"
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value}${name === 'avgScore' ? '%' : '%'}`,
                          name === 'avgScore' ? 'Avg Score' : 'Completion Rate',
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return `${payload[0].payload.testTitle} (${payload[0].payload.attempts} attempts)`;
                          }
                          return label;
                        }}
                      />
                      <Scatter dataKey="avgScore" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-sm text-gray-600">
                    Each point represents a test. X-axis: Average Score, Y-axis:
                    Completion Rate
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tests Tab */}
          {viewMode === 'tests' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {testSummaries.map((test) => (
                  <div
                    key={test.testId}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-gray-200 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {test.testTitle}
                        </h3>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>{test.totalAttempts} attempts</span>
                          <span>{test.completionRate}% completion</span>
                          <span>Avg: {test.avgScore}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">
                            {test.totalAttempts}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total Attempts
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-700">
                            {test.completedAttempts}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-800">
                            {test.avgScore}
                          </div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary-600">
                            {test.topScore}
                          </div>
                          <div className="text-xs text-gray-500">Top Score</div>
                        </div>
                      </div>

                      {/* Top candidates for this test */}
                      <h4 className="mb-3 text-sm font-medium text-gray-900">
                        Top Candidates
                      </h4>
                      <div className="space-y-2">
                        {test.candidates.slice(0, 5).map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-800">
                                {index + 1}
                              </span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.candidateName || 'Anonymous'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {candidate.candidateEmail}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.rawScore}/{candidate.totalQuestions}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round(
                                  ((candidate.rawScore || 0) /
                                    candidate.totalQuestions) *
                                    100
                                )}
                                %
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Tab */}
          {viewMode === 'candidates' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {showSearchResults
                      ? `Search Results (${searchResults.length})`
                      : 'All Candidates'}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Candidate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Test
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Skills Breakdown
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {(showSearchResults ? searchResults : filteredAnalytics)
                        .slice(0, 20)
                        .map((candidate) => (
                          <tr key={candidate.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {candidate.candidateName || 'Anonymous'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {candidate.candidateEmail}
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                              {candidate.testTitle}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {candidate.rawScore}/{candidate.totalQuestions}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round(
                                  ((candidate.rawScore || 0) /
                                    candidate.totalQuestions) *
                                    100
                                )}
                                %
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex space-x-1">
                                {Object.entries(candidate.categoryScores).map(
                                  ([category, score]) => (
                                    <div key={category} className="text-xs">
                                      <div
                                        className={`rounded px-1 py-0.5 text-white ${
                                          score.score >= 80
                                            ? 'bg-primary-600'
                                            : score.score >= 60
                                              ? 'bg-secondary-600'
                                              : 'bg-red-500'
                                        }`}
                                      >
                                        {category.substring(0, 3)}:{' '}
                                        {score.score}%
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                              {candidate.durationSeconds
                                ? Math.round(candidate.durationSeconds / 60)
                                : 'N/A'}
                              m
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  candidate.status === 'COMPLETED'
                                    ? 'bg-primary-100 text-primary-700'
                                    : candidate.status === 'IN_PROGRESS'
                                      ? 'bg-secondary-100 text-secondary-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {candidate.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                              {candidate.status === 'COMPLETED' ? (
                                <a
                                  href={`/admin/proctor/${candidate.id}`}
                                  className="inline-flex items-center rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                >
                                  View Details
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
