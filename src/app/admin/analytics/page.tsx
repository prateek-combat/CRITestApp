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
  AreaChart,
  Area,
} from 'recharts';

interface CategoryScoreDetail {
  correct: number;
  total: number;
}

interface TestAttemptAnalytics {
  attemptId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  testTitle: string;
  completedAt: string | null;
  status: string;
  rawScore: number | null;
  calculatedTotalQuestions: number;
  actualTotalTestQuestions: number;
  percentile: number | null;
  categoryScores: Record<QuestionCategory, CategoryScoreDetail>;
  tabSwitches: number;
  ipAddress: string | null;
  testTakenDurationSeconds: number | null;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analytics, setAnalytics] = useState<TestAttemptAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('30'); // days
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const invitationId = searchParams.get('invitationId');
      const apiUrl = invitationId
        ? `/api/admin/analytics/test-attempts?invitationId=${invitationId}`
        : '/api/admin/analytics/test-attempts';

      const response = await fetch(apiUrl);
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
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return; // Still loading session
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredAnalytics.length) return null;

    const totalAttempts = filteredAnalytics.length;
    const completedAttempts = filteredAnalytics.filter(
      (a) => a.status === 'COMPLETED'
    );
    const avgScore =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.rawScore || 0), 0) /
          completedAttempts.length
        : 0;
    const avgDuration =
      completedAttempts.length > 0
        ? completedAttempts.reduce(
            (sum, a) => sum + (a.testTakenDurationSeconds || 0),
            0
          ) / completedAttempts.length
        : 0;
    const completionRate = (completedAttempts.length / totalAttempts) * 100;
    const avgTabSwitches =
      completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.tabSwitches || 0), 0) /
          completedAttempts.length
        : 0;

    // Calculate percentile distribution
    const percentileRanges = [
      { name: '90-100th', min: 90, count: 0 },
      { name: '75-89th', min: 75, count: 0 },
      { name: '50-74th', min: 50, count: 0 },
      { name: '25-49th', min: 25, count: 0 },
      { name: '0-24th', min: 0, count: 0 },
    ];

    completedAttempts.forEach((attempt) => {
      if (attempt.percentile !== null) {
        const range = percentileRanges.find(
          (r) => attempt.percentile! >= r.min
        );
        if (range) range.count++;
      }
    });

    return {
      totalAttempts,
      completedAttempts: completedAttempts.length,
      avgScore: avgScore.toFixed(1),
      avgDuration: Math.round(avgDuration / 60), // in minutes
      completionRate: completionRate.toFixed(1),
      avgTabSwitches: avgTabSwitches.toFixed(1),
      percentileDistribution: percentileRanges,
    };
  }, [filteredAnalytics]);

  // Calculate time-based performance trends
  const performanceTrend = useMemo(() => {
    if (!filteredAnalytics.length) return [];

    const dailyData: Record<
      string,
      { date: string; avgScore: number; attempts: number; totalScore: number }
    > = {};

    filteredAnalytics.forEach((attempt) => {
      if (
        attempt.completedAt &&
        attempt.status === 'COMPLETED' &&
        attempt.rawScore !== null
      ) {
        const date = new Date(attempt.completedAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, avgScore: 0, attempts: 0, totalScore: 0 };
        }
        dailyData[date].totalScore += attempt.rawScore;
        dailyData[date].attempts += 1;
      }
    });

    return Object.values(dailyData)
      .map((day) => ({
        ...day,
        avgScore:
          day.attempts > 0 ? (day.totalScore / day.attempts).toFixed(1) : '0',
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days
  }, [filteredAnalytics]);

  // Calculate score distribution data
  const scoreDistributionData = useMemo(() => {
    if (!filteredAnalytics.length) return [];

    const buckets = [
      { name: '0-20%', min: 0, max: 20, count: 0, fill: '#ef4444' },
      { name: '21-40%', min: 21, max: 40, count: 0, fill: '#f97316' },
      { name: '41-60%', min: 41, max: 60, count: 0, fill: '#eab308' },
      { name: '61-80%', min: 61, max: 80, count: 0, fill: '#22c55e' },
      { name: '81-100%', min: 81, max: 100, count: 0, fill: '#10b981' },
    ];

    filteredAnalytics.forEach((attempt) => {
      if (attempt.rawScore !== null && attempt.actualTotalTestQuestions > 0) {
        const percentage =
          (attempt.rawScore / attempt.actualTotalTestQuestions) * 100;
        for (const bucket of buckets) {
          if (percentage >= bucket.min && percentage <= bucket.max) {
            bucket.count++;
            break;
          }
        }
      }
    });

    return buckets;
  }, [filteredAnalytics]);

  // Calculate category performance data
  const categoryPerformanceData = useMemo(() => {
    if (!filteredAnalytics.length) return [];

    const categoryTotals: Record<string, { correct: number; total: number }> =
      {};

    filteredAnalytics.forEach((attempt) => {
      Object.entries(attempt.categoryScores).forEach(([category, score]) => {
        if (!categoryTotals[category]) {
          categoryTotals[category] = { correct: 0, total: 0 };
        }
        categoryTotals[category].correct += score.correct;
        categoryTotals[category].total += score.total;
      });
    });

    return Object.entries(categoryTotals).map(([category, totals]) => ({
      category: category.replace(/_/g, ' '),
      percentage:
        totals.total > 0
          ? ((totals.correct / totals.total) * 100).toFixed(1)
          : '0',
      correct: totals.correct,
      total: totals.total,
      accuracy: totals.total > 0 ? (totals.correct / totals.total) * 100 : 0,
    }));
  }, [filteredAnalytics]);

  // Calculate completion status distribution
  const statusDistribution = useMemo(() => {
    if (!filteredAnalytics.length) return [];

    const statusCounts: Record<string, number> = {};
    filteredAnalytics.forEach((attempt) => {
      statusCounts[attempt.status] = (statusCounts[attempt.status] || 0) + 1;
    });

    const colors = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

    return Object.entries(statusCounts).map(([status, count], index) => ({
      name: status.replace('_', ' '),
      value: count,
      fill: colors[index % colors.length],
    }));
  }, [filteredAnalytics]);

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Show loading while session is being checked
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Test performance insights and statistics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Frame Selector */}
          <select
            value={selectedTimeFrame}
            onChange={(e) => setSelectedTimeFrame(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white shadow-sm transition duration-150 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="ml-3 text-gray-600">Loading analytics data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="mb-6 rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
          role="alert"
        >
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
              <p className="font-bold">Error Loading Data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAnalytics.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No test attempts found
          </h3>
          <p className="mt-2 text-gray-500">
            There are no test attempts in the selected time frame.
          </p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && filteredAnalytics.length > 0 && (
        <div className="space-y-8">
          {/* Summary Statistics Cards */}
          {summaryStats && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Total Attempts
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.totalAttempts}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Completed
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.completedAttempts}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Avg Score
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.avgScore}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Avg Duration
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.avgDuration}m
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Completion Rate
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.completionRate}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Avg Tab Switches
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {summaryStats.avgTabSwitches}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Performance Trend Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md lg:col-span-2">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Performance Trend (Last 14 Days)
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={performanceTrend}>
                    <defs>
                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8884d8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === 'avgScore' ? 'Average Score' : 'Attempts',
                      ]}
                      labelFormatter={(value) => `Date: ${value}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      name="Average Score"
                    />
                    <Bar
                      dataKey="attempts"
                      fill="#82ca9d"
                      name="Daily Attempts"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Score Distribution
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={scoreDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#4F46E5"
                      name="Number of Attempts"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Pie Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Test Status Distribution
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Performance Chart */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md lg:col-span-2">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Category Performance Analysis
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryPerformanceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Success Rate']}
                    />
                    <Bar
                      dataKey="percentage"
                      fill="#10B981"
                      name="Success Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Test Attempts Table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-md">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Test Attempts
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
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tab Switches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAnalytics.slice(0, 20).map((attempt, index) => (
                    <tr
                      key={`${attempt.attemptId}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attempt.candidateName || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.candidateEmail || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {attempt.testTitle}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.rawScore ?? '-'} /{' '}
                          {attempt.actualTotalTestQuestions}
                        </div>
                        {attempt.percentile && (
                          <div className="text-sm text-gray-500">
                            {attempt.percentile.toFixed(1)}th percentile
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDuration(attempt.testTakenDurationSeconds)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            (attempt.tabSwitches || 0) > 5
                              ? 'bg-red-100 text-red-800'
                              : (attempt.tabSwitches || 0) > 2
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {attempt.tabSwitches || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            attempt.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : attempt.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {attempt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString()
                          : 'N/A'}
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
  );
}
