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
} from 'recharts';
import Link from 'next/link';

// Utility function to safely convert to number and handle NaN
const toNumber = (value: any) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Utility function to safely calculate percentage
const safePercentage = (value: number, total: number): number => {
  if (total === 0 || isNaN(value) || isNaN(total)) return 0;
  const percentage = (value / total) * 100;
  return isNaN(percentage) ? 0 : Math.round(percentage * 10) / 10;
};

interface TestAttemptData {
  id: string;
  testId: string;
  testTitle: string;
  candidateName: string | null;
  candidateEmail: string | null;
  completedAt: string | null;
  status: string;
  rawScore: number | null;
  totalQuestions: number;
  durationSeconds: number | null;
  categoryScores: Record<string, { correct: number; total: number }>;
  isPublicAttempt: boolean;
}

interface AnalyticsStats {
  totalTests: number;
  totalCandidates: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averageDuration: number;
  completionRate: number;
}

const AnalyticsPage = () => {
  const { data: session, status } = useSession();

  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tests' | 'candidates'
  >('overview');
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (attemptId: string) => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this test attempt and all its data? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(attemptId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/test-attempts/${attemptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete test attempt');
      }

      // Remove the deleted attempt from the state
      setAnalyticsData((prevAnalyticsData) =>
        prevAnalyticsData.filter((attempt) => attempt.id !== attemptId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  // Search filtered data
  const searchFilteredAttempts = useMemo(() => {
    if (!searchTerm.trim()) return filteredAttempts;

    const term = searchTerm.toLowerCase();
    return filteredAttempts.filter(
      (attempt) =>
        attempt.candidateName?.toLowerCase().includes(term) ||
        attempt.candidateEmail?.toLowerCase().includes(term) ||
        attempt.testTitle?.toLowerCase().includes(term)
    );
  }, [filteredAttempts, searchTerm]);

  // Calculate overall statistics
  const stats = useMemo((): AnalyticsStats => {
    const completed = filteredAttempts.filter((a) => a.status === 'COMPLETED');
    const uniqueCandidates = new Set(
      filteredAttempts.map((a) => a.candidateEmail).filter(Boolean)
    ).size;
    const uniqueTests = new Set(filteredAttempts.map((a) => a.testId)).size;

    // Safe calculations for scores and durations
    const validScores = completed.filter((a) => {
      const score = toNumber(a.rawScore);
      const total = toNumber(a.totalQuestions);
      return score >= 0 && total > 0;
    });

    const validDurations = completed.filter((a) => {
      const duration = toNumber(a.durationSeconds);
      return duration > 0;
    });

    const avgScore =
      validScores.length > 0
        ? validScores.reduce((sum, a) => {
            const score = toNumber(a.rawScore);
            const total = toNumber(a.totalQuestions);
            return sum + safePercentage(score, total);
          }, 0) / validScores.length
        : 0;

    const avgDuration =
      validDurations.length > 0
        ? validDurations.reduce(
            (sum, a) => sum + toNumber(a.durationSeconds),
            0
          ) /
          validDurations.length /
          60
        : 0;

    return {
      totalTests: uniqueTests,
      totalCandidates: uniqueCandidates,
      totalAttempts: filteredAttempts.length,
      completedAttempts: completed.length,
      averageScore: toNumber(avgScore),
      averageDuration: toNumber(avgDuration),
      completionRate: safePercentage(completed.length, filteredAttempts.length),
    };
  }, [filteredAttempts]);

  // Performance distribution data with safe chart values
  const performanceData = useMemo(() => {
    const ranges = [
      { name: '0-20%', min: 0, max: 20, count: 0 },
      { name: '21-40%', min: 21, max: 40, count: 0 },
      { name: '41-60%', min: 41, max: 60, count: 0 },
      { name: '61-80%', min: 61, max: 80, count: 0 },
      { name: '81-100%', min: 81, max: 100, count: 0 },
    ];

    const completed = filteredAttempts.filter((a) => a.status === 'COMPLETED');

    completed.forEach((attempt) => {
      const score = toNumber(attempt.rawScore);
      const total = toNumber(attempt.totalQuestions);

      if (total > 0) {
        const percentage = safePercentage(score, total);
        const range = ranges.find(
          (r) => percentage >= r.min && percentage <= r.max
        );
        if (range) range.count++;
      }
    });

    // Ensure all values are safe numbers and not NaN
    return ranges
      .map((range) => ({
        name: range.name,
        value: toNumber(range.count),
        count: range.count,
      }))
      .filter(
        (item) => !isNaN(item.value) && isFinite(item.value) && item.value >= 0
      );
  }, [filteredAttempts]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Error Loading Analytics
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            📊 Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into test performance and candidate analytics
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Time Range Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                📅 Time Range:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates or tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-80"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'tests', name: 'Tests', icon: '📝' },
                { id: 'candidates', name: 'Candidates', icon: '👥' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Tests
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalTests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Total Candidates
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalCandidates}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Average Score
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.averageScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">⏰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      Avg Duration
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.averageDuration.toFixed(1)}m
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart - Safe version with extra protection */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                📈 Score Distribution
              </h3>
              {performanceData.length > 0 &&
              performanceData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={performanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      domain={[0, 'dataMax']}
                      allowDataOverflow={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: any) => [
                        `${toNumber(value)} candidates`,
                        'Count',
                      ]}
                      labelFormatter={(label) => `Score Range: ${label}`}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">📊</div>
                    <p>No performance data available</p>
                    <p className="mt-2 text-sm">
                      Complete some tests to see the distribution
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                📋 Quick Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalAttempts}
                  </div>
                  <div className="text-sm text-gray-500">Total Attempts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completedAttempts}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Completion Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.averageScore.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Average Score</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📝 Test Summary
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalTests}
                  </div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalAttempts}
                  </div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {stats.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                👥 Candidate Results
                {searchTerm && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({searchFilteredAttempts.length} found)
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Analysis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {searchFilteredAttempts.slice(0, 50).map((attempt) => {
                    const score = toNumber(attempt.rawScore);
                    const total = toNumber(attempt.totalQuestions);
                    const percentage =
                      total > 0 ? safePercentage(score, total) : 0;

                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {attempt.candidateName || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.candidateEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {attempt.testTitle}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {score}/{total} ({percentage.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              attempt.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : attempt.status === 'IN_PROGRESS'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {attempt.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {attempt.completedAt
                            ? new Date(attempt.completedAt).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <Link
                            href={`/admin/analytics/analysis/${attempt.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Analysis
                          </Link>
                          {session?.user?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDelete(attempt.id)}
                              disabled={deleting === attempt.id}
                              className="ml-4 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400"
                            >
                              {deleting === attempt.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {searchFilteredAttempts.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mb-4 text-4xl">📭</div>
                  <p className="text-gray-500">No results found</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-blue-500 hover:text-blue-600"
                    >
                      Clear search
                    </button>
                  )}
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
