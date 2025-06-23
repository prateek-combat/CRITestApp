'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';

// Utility function to safely convert to number and handle NaN
const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

import { safePercentage } from '@/lib/validation-utils';

interface TestAttemptData {
  id: string;
  testId: string;
  testTitle?: string;
  testName?: string;
  candidateName: string | null;
  candidateEmail: string | null;
  completedAt: string | null;
  startedAt: string | null;
  status: string;
  rawScore: number | null;
  totalQuestions: number;
  durationSeconds: number | null;
  categoryScores: Record<string, { correct: number; total: number }>;
  isPublicAttempt: boolean;
}

interface TestAnalytics {
  testId: string;
  testTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  averageScore: number;
  averageDuration: number;
  highestScore: number;
  lowestScore: number;
  lastAttemptDate: string | null;
  scoreDistribution: { range: string; count: number }[];
  recentTrend: 'up' | 'down' | 'stable';
}

const AnalyticsPage = () => {
  const { data: session, status } = useSession();

  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    'attempts' | 'completion' | 'score' | 'recent'
  >('recent');

  // New state for tabs and test attempts management
  const [activeTab, setActiveTab] = useState<'overview' | 'attempts'>(
    'overview'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [attemptSortBy, setAttemptSortBy] = useState<
    'date' | 'name' | 'test' | 'score'
  >('date');
  const [attemptSortOrder, setAttemptSortOrder] = useState<'asc' | 'desc'>(
    'desc'
  );
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null
  );
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(
    null
  );
  const [selectedTestFilter, setSelectedTestFilter] = useState<string>('all');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics/test-attempts');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch analytics`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setAnalyticsData(data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Delete test attempt function
  const deleteTestAttempt = useCallback(
    async (attemptId: string, isPublic: boolean) => {
      if (
        !confirm(
          'Are you sure you want to delete this test attempt? This action cannot be undone.'
        )
      ) {
        return;
      }

      setDeletingAttemptId(attemptId);
      try {
        const endpoint = isPublic
          ? `/api/admin/test-attempts/${attemptId}?type=public`
          : `/api/admin/test-attempts/${attemptId}`;
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete test attempt');
        }

        // Refresh data
        await fetchAnalytics();
        setSelectedAttemptId(null);
      } catch (error) {
        console.error('Error deleting test attempt:', error);
        alert('Failed to delete test attempt. Please try again.');
      } finally {
        setDeletingAttemptId(null);
      }
    },
    [fetchAnalytics]
  );

  // Filter data by time range
  const filteredAttempts = useMemo(() => {
    if (timeRange === 'all' || !timeRange) return analyticsData;

    const days = parseInt(timeRange);
    if (isNaN(days)) return analyticsData;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return analyticsData.filter((attempt) => {
      if (!attempt.completedAt) return false;
      const completedDate = new Date(attempt.completedAt);
      return completedDate >= cutoffDate;
    });
  }, [analyticsData, timeRange]);

  // Filtered and sorted test attempts for the attempts tab
  const processedAttempts = useMemo(() => {
    let filtered = filteredAttempts;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (attempt) =>
          attempt.candidateName?.toLowerCase().includes(search) ||
          attempt.candidateEmail?.toLowerCase().includes(search) ||
          attempt.testTitle?.toLowerCase().includes(search) ||
          attempt.testName?.toLowerCase().includes(search)
      );
    }

    // Apply test filter
    if (selectedTestFilter !== 'all') {
      filtered = filtered.filter(
        (attempt) => attempt.testId === selectedTestFilter
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aVal, bVal;

      switch (attemptSortBy) {
        case 'name':
          aVal = (a.candidateName || '').toLowerCase();
          bVal = (b.candidateName || '').toLowerCase();
          break;
        case 'test':
          aVal = (a.testTitle || a.testName || '').toLowerCase();
          bVal = (b.testTitle || b.testName || '').toLowerCase();
          break;
        case 'score':
          aVal = toNumber(a.rawScore);
          bVal = toNumber(b.rawScore);
          break;
        case 'date':
        default:
          aVal = new Date(a.completedAt || a.startedAt || 0).getTime();
          bVal = new Date(b.completedAt || b.startedAt || 0).getTime();
          break;
      }

      if (attemptSortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [
    filteredAttempts,
    searchTerm,
    selectedTestFilter,
    attemptSortBy,
    attemptSortOrder,
  ]);

  // Get unique tests for the filter dropdown
  const uniqueTests = useMemo(() => {
    const testMap = new Map<string, string>();
    filteredAttempts.forEach((attempt) => {
      if (!testMap.has(attempt.testId)) {
        testMap.set(
          attempt.testId,
          attempt.testTitle || attempt.testName || 'Unknown Test'
        );
      }
    });
    return Array.from(testMap.entries()).map(([id, title]) => ({ id, title }));
  }, [filteredAttempts]);

  // Calculate test-specific analytics
  const testAnalytics = useMemo((): TestAnalytics[] => {
    const testMap = new Map<string, TestAnalytics>();

    filteredAttempts.forEach((attempt) => {
      const testId = attempt.testId;
      const testTitle = attempt.testTitle || attempt.testName || 'Unknown Test';

      if (!testMap.has(testId)) {
        testMap.set(testId, {
          testId,
          testTitle,
          totalAttempts: 0,
          completedAttempts: 0,
          completionRate: 0,
          averageScore: 0,
          averageDuration: 0,
          highestScore: 0,
          lowestScore: 100,
          lastAttemptDate: null,
          scoreDistribution: [
            { range: '0-20%', count: 0 },
            { range: '21-40%', count: 0 },
            { range: '41-60%', count: 0 },
            { range: '61-80%', count: 0 },
            { range: '81-100%', count: 0 },
          ],
          recentTrend: 'stable' as const,
        });
      }

      const testStats = testMap.get(testId)!;
      testStats.totalAttempts++;

      if (attempt.status === 'COMPLETED') {
        testStats.completedAttempts++;

        const score = toNumber(attempt.rawScore);
        const total = toNumber(attempt.totalQuestions);
        const percentage = total > 0 ? safePercentage(score, total) : 0;

        testStats.averageScore =
          (testStats.averageScore * (testStats.completedAttempts - 1) +
            percentage) /
          testStats.completedAttempts;
        testStats.highestScore = Math.max(testStats.highestScore, percentage);
        testStats.lowestScore = Math.min(testStats.lowestScore, percentage);

        // Duration calculation
        const duration = toNumber(attempt.durationSeconds) / 60; // Convert to minutes
        if (duration > 0) {
          testStats.averageDuration =
            (testStats.averageDuration * (testStats.completedAttempts - 1) +
              duration) /
            testStats.completedAttempts;
        }

        // Score distribution
        const rangeIndex = Math.min(Math.floor(percentage / 20), 4);
        testStats.scoreDistribution[rangeIndex].count++;
      }

      // Update last attempt date
      if (attempt.completedAt) {
        const attemptDate = new Date(attempt.completedAt).toISOString();
        if (
          !testStats.lastAttemptDate ||
          attemptDate > testStats.lastAttemptDate
        ) {
          testStats.lastAttemptDate = attemptDate;
        }
      }
    });

    // Calculate completion rates and trends
    testMap.forEach((testStats) => {
      testStats.completionRate =
        testStats.totalAttempts > 0
          ? safePercentage(testStats.completedAttempts, testStats.totalAttempts)
          : 0;

      // Reset lowest score if no completed attempts
      if (testStats.completedAttempts === 0) {
        testStats.lowestScore = 0;
      }
    });

    return Array.from(testMap.values()).sort((a, b) => {
      switch (sortBy) {
        case 'attempts':
          return b.totalAttempts - a.totalAttempts;
        case 'completion':
          return b.completionRate - a.completionRate;
        case 'score':
          return b.averageScore - a.averageScore;
        case 'recent':
        default:
          if (!a.lastAttemptDate && !b.lastAttemptDate) return 0;
          if (!a.lastAttemptDate) return 1;
          if (!b.lastAttemptDate) return -1;
          return (
            new Date(b.lastAttemptDate).getTime() -
            new Date(a.lastAttemptDate).getTime()
          );
      }
    });
  }, [filteredAttempts, sortBy]);

  // Auto-select the latest test when page loads
  useEffect(() => {
    if (
      testAnalytics.length > 0 &&
      !selectedTestId &&
      activeTab === 'overview'
    ) {
      setSelectedTestId(testAnalytics[0].testId);
    }
  }, [testAnalytics, selectedTestId, activeTab]);

  // Get selected test details
  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return testAnalytics.find((t) => t.testId === selectedTestId) || null;
  }, [selectedTestId, testAnalytics]);

  // Get selected attempt details
  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return null;
    return processedAttempts.find((a) => a.id === selectedAttemptId) || null;
  }, [selectedAttemptId, processedAttempts]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Error Loading Analytics
          </h2>
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="mb-1 text-xl font-bold text-gray-900">
            📊 Test Analytics
          </h1>
          <p className="text-sm text-gray-600">
            Performance insights and test attempt management
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                📈 Test Overview
              </button>
              <button
                onClick={() => setActiveTab('attempts')}
                className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === 'attempts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                👥 Test Attempts ({processedAttempts.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            {/* Time Range Filter */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700">
                📅 Time Range:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Tab-specific controls */}
            {activeTab === 'overview' ? (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">
                  🔄 Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="recent">Recent Activity</option>
                  <option value="attempts">Total Attempts</option>
                  <option value="completion">Completion Rate</option>
                  <option value="score">Average Score</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selectedTestFilter}
                  onChange={(e) => setSelectedTestFilter(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Tests ({uniqueTests.length})</option>
                  {uniqueTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search by name, email, or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={attemptSortBy}
                  onChange={(e) => setAttemptSortBy(e.target.value as any)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="test">Test</option>
                  <option value="score">Score</option>
                </select>
                <button
                  onClick={() =>
                    setAttemptSortOrder(
                      attemptSortOrder === 'asc' ? 'desc' : 'asc'
                    )
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                >
                  {attemptSortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          // Test Analytics Grid - existing content
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Test List */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Test Performance Overview ({testAnalytics.length} tests)
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {testAnalytics.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No test data available for the selected time range
                    </div>
                  ) : (
                    testAnalytics.map((test) => (
                      <div
                        key={test.testId}
                        className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                          selectedTestId === test.testId
                            ? 'border-l-4 border-blue-500 bg-blue-50'
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedTestId(
                            test.testId === selectedTestId ? null : test.testId
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-medium text-gray-900">
                              {test.testTitle}
                            </h3>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              <span>📝 {test.totalAttempts} attempts</span>
                              <span>
                                ✅ {test.completionRate.toFixed(1)}% completion
                              </span>
                              <span>
                                📊 {test.averageScore.toFixed(1)}% avg score
                              </span>
                              {test.averageDuration > 0 && (
                                <span>
                                  ⏱️ {test.averageDuration.toFixed(1)}m avg time
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Performance indicator */}
                            <div
                              className={`h-2 w-2 rounded-full ${
                                test.averageScore >= 80
                                  ? 'bg-green-500'
                                  : test.averageScore >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                            ></div>
                            <span className="text-xs text-gray-400">
                              {test.lastAttemptDate
                                ? new Date(
                                    test.lastAttemptDate
                                  ).toLocaleDateString()
                                : 'No attempts'}
                            </span>
                          </div>
                        </div>

                        {/* Quick stats bar */}
                        <div className="mt-2 flex gap-1">
                          <div className="h-1 flex-1 rounded-full bg-gray-200">
                            <div
                              className="h-1 rounded-full bg-blue-500"
                              style={{ width: `${test.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Test Details Panel */}
            <div className="lg:col-span-1">
              {selectedTest ? (
                <div className="rounded-lg bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedTest.testTitle}
                    </h3>
                    <p className="text-xs text-gray-500">Detailed Analysis</p>
                  </div>
                  <div className="space-y-4 p-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded bg-blue-50 p-2 text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {selectedTest.totalAttempts}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total Attempts
                        </div>
                      </div>
                      <div className="rounded bg-green-50 p-2 text-center">
                        <div className="text-lg font-bold text-green-600">
                          {selectedTest.completionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Completion</div>
                      </div>
                      <div className="rounded bg-purple-50 p-2 text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {selectedTest.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                      <div className="rounded bg-orange-50 p-2 text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {selectedTest.averageDuration.toFixed(1)}m
                        </div>
                        <div className="text-xs text-gray-600">Avg Time</div>
                      </div>
                    </div>

                    {/* Score Distribution */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900">
                        Score Distribution
                      </h4>
                      <div className="space-y-1">
                        {selectedTest.scoreDistribution.map((range, index) => (
                          <div
                            key={range.range}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-gray-600">{range.range}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 rounded-full bg-gray-200">
                                <div
                                  className="h-1 rounded-full bg-blue-500"
                                  style={{
                                    width: `${selectedTest.completedAttempts > 0 ? (range.count / selectedTest.completedAttempts) * 100 : 0}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="w-6 text-right">
                                {range.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Range */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900">
                        Score Range
                      </h4>
                      <div className="flex justify-between text-xs">
                        <div className="text-center">
                          <div className="font-bold text-red-600">
                            {selectedTest.lowestScore.toFixed(1)}%
                          </div>
                          <div className="text-gray-500">Lowest</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">
                            {selectedTest.highestScore.toFixed(1)}%
                          </div>
                          <div className="text-gray-500">Highest</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-2">
                      <Link
                        href={`/admin/leaderboard?testId=${selectedTest.testId}`}
                        className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        View Leaderboard
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="text-center text-sm text-gray-500">
                    Click on a test to see detailed analysis
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Test Attempts List - new content
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Attempts List */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    Test Attempts ({processedAttempts.length})
                    {selectedTestFilter !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        •{' '}
                        {
                          uniqueTests.find((t) => t.id === selectedTestFilter)
                            ?.title
                        }
                      </span>
                    )}
                  </h2>
                  {selectedTestFilter !== 'all' &&
                    processedAttempts.length > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          ✅{' '}
                          {
                            processedAttempts.filter(
                              (a) => a.status === 'COMPLETED'
                            ).length
                          }{' '}
                          completed
                        </span>
                        <span>
                          🔄{' '}
                          {
                            processedAttempts.filter(
                              (a) => a.status === 'IN_PROGRESS'
                            ).length
                          }{' '}
                          in progress
                        </span>
                        <span>
                          📊{' '}
                          {processedAttempts.filter(
                            (a) => a.status === 'COMPLETED'
                          ).length > 0
                            ? (
                                processedAttempts
                                  .filter((a) => a.status === 'COMPLETED')
                                  .reduce(
                                    (sum, a) =>
                                      sum +
                                      safePercentage(
                                        toNumber(a.rawScore),
                                        toNumber(a.totalQuestions)
                                      ),
                                    0
                                  ) /
                                processedAttempts.filter(
                                  (a) => a.status === 'COMPLETED'
                                ).length
                              ).toFixed(1)
                            : '0'}
                          % avg score
                        </span>
                      </div>
                    )}
                </div>
                <div className="divide-y divide-gray-200">
                  {processedAttempts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No test attempts found for the selected criteria
                    </div>
                  ) : (
                    processedAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className={`cursor-pointer p-3 transition-colors hover:bg-gray-50 ${
                          selectedAttemptId === attempt.id
                            ? 'border-l-4 border-blue-500 bg-blue-50'
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedAttemptId(
                            attempt.id === selectedAttemptId ? null : attempt.id
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {attempt.candidateName || 'Anonymous'}
                              </h3>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  attempt.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800'
                                    : attempt.status === 'IN_PROGRESS'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {attempt.status}
                              </span>
                              {attempt.isPublicAttempt && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                  Public
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {attempt.candidateEmail}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                📝 {attempt.testTitle || attempt.testName}
                              </span>
                              {attempt.status === 'COMPLETED' && (
                                <span>
                                  📊{' '}
                                  {safePercentage(
                                    toNumber(attempt.rawScore),
                                    toNumber(attempt.totalQuestions)
                                  ).toFixed(1)}
                                  %
                                </span>
                              )}
                              <span>
                                📅{' '}
                                {new Date(
                                  attempt.completedAt || attempt.startedAt || ''
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTestAttempt(
                                  attempt.id,
                                  attempt.isPublicAttempt
                                );
                              }}
                              disabled={deletingAttemptId === attempt.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Delete attempt"
                            >
                              {deletingAttemptId === attempt.id ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Attempt Details Panel */}
            <div className="lg:col-span-1">
              {selectedAttempt ? (
                <div className="rounded-lg bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedAttempt.candidateName || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-gray-500">Attempt Details</p>
                  </div>
                  <div className="space-y-3 p-4">
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">
                          {selectedAttempt.candidateEmail || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Test:</span>
                        <span className="font-medium">
                          {selectedAttempt.testTitle ||
                            selectedAttempt.testName}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-medium ${
                            selectedAttempt.status === 'COMPLETED'
                              ? 'text-green-600'
                              : selectedAttempt.status === 'IN_PROGRESS'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {selectedAttempt.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">
                          {selectedAttempt.isPublicAttempt
                            ? 'Public'
                            : 'Invited'}
                        </span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {selectedAttempt.status === 'COMPLETED' && (
                      <div className="border-t border-gray-200 pt-3">
                        <h4 className="mb-2 text-xs font-medium text-gray-900">
                          Performance
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded bg-blue-50 p-2 text-center">
                            <div className="text-sm font-bold text-blue-600">
                              {toNumber(selectedAttempt.rawScore)}/
                              {toNumber(selectedAttempt.totalQuestions)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Raw Score
                            </div>
                          </div>
                          <div className="rounded bg-green-50 p-2 text-center">
                            <div className="text-sm font-bold text-green-600">
                              {safePercentage(
                                toNumber(selectedAttempt.rawScore),
                                toNumber(selectedAttempt.totalQuestions)
                              ).toFixed(1)}
                              %
                            </div>
                            <div className="text-xs text-gray-600">
                              Percentage
                            </div>
                          </div>
                        </div>
                        {selectedAttempt.durationSeconds && (
                          <div className="mt-2 rounded bg-purple-50 p-2 text-center">
                            <div className="text-sm font-bold text-purple-600">
                              {Math.round(
                                toNumber(selectedAttempt.durationSeconds) / 60
                              )}
                              m
                            </div>
                            <div className="text-xs text-gray-600">
                              Duration
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="mb-2 text-xs font-medium text-gray-900">
                        Timeline
                      </h4>
                      <div className="space-y-1 text-xs">
                        {selectedAttempt.startedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Started:</span>
                            <span>
                              {new Date(
                                selectedAttempt.startedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedAttempt.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span>
                              {new Date(
                                selectedAttempt.completedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="space-y-2">
                        <Link
                          href={`/admin/analytics/analysis/${selectedAttempt.id}`}
                          className="inline-flex w-full items-center justify-center rounded border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          📊 View Analysis
                        </Link>
                        <button
                          onClick={() =>
                            deleteTestAttempt(
                              selectedAttempt.id,
                              selectedAttempt.isPublicAttempt
                            )
                          }
                          disabled={deletingAttemptId === selectedAttempt.id}
                          className="inline-flex w-full items-center justify-center rounded border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingAttemptId === selectedAttempt.id
                            ? '⏳ Deleting...'
                            : '🗑️ Delete Attempt'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="text-center text-sm text-gray-500">
                    Click on an attempt to see details
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
