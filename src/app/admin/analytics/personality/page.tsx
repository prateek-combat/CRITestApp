'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Area,
  AreaChart,
} from 'recharts';

interface PersonalityDimensionAnalytics {
  dimensionCode: string;
  dimensionName: string;
  averageScore: number;
  sampleCount: number;
  distribution: Array<{
    scoreRange: string;
    count: number;
    percentage: number;
  }>;
  testCount: number;
}

interface PersonalityCorrelationData {
  dimension1: string;
  dimension2: string;
  correlation: number;
  sampleSize: number;
}

interface PersonalityTrendData {
  date: string;
  dimensionCode: string;
  averageScore: number;
  sampleCount: number;
}

interface PersonalityComparisonData {
  dimension: string;
  highCognitive: number;
  lowCognitive: number;
  difference: number;
}

interface PersonalityAnalyticsData {
  dimensionAnalytics: PersonalityDimensionAnalytics[];
  correlationMatrix: PersonalityCorrelationData[];
  trendData: PersonalityTrendData[];
  cognitiveComparison: PersonalityComparisonData[];
  dimensionPopularity: Array<{
    dimension: string;
    testCount: number;
    sampleCount: number;
  }>;
  summary: {
    totalAttempts: number;
    uniqueDimensions: number;
    uniqueTests: number;
    dateRange: {
      start: number | null;
      end: number | null;
    };
  };
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#0088fe',
  '#00c49f',
  '#ffbb28',
  '#ff8042',
];

export default function PersonalityAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<PersonalityAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [invitationType, setInvitationType] = useState<
    'all' | 'invitation' | 'public'
  >('all');
  const [minCognitive, setMinCognitive] = useState<string>('');
  const [maxCognitive, setMaxCognitive] = useState<string>('');

  // View state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'dimensions' | 'correlations' | 'trends' | 'comparison'
  >('overview');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedTestIds.length > 0)
        params.append('testIds', selectedTestIds.join(','));
      if (invitationType !== 'all')
        params.append('invitationType', invitationType);
      if (minCognitive) params.append('minCognitive', minCognitive);
      if (maxCognitive) params.append('maxCognitive', maxCognitive);

      const response = await fetch(
        `/api/admin/analytics/personality?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch personality analytics data');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    startDate,
    endDate,
    selectedTestIds,
    invitationType,
    minCognitive,
    maxCognitive,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedTestIds.length > 0)
        params.append('testIds', selectedTestIds.join(','));
      if (invitationType !== 'all')
        params.append('invitationType', invitationType);
      if (minCognitive) params.append('minCognitive', minCognitive);
      if (maxCognitive) params.append('maxCognitive', maxCognitive);

      const response = await fetch(
        `/api/admin/analytics/personality/export?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personality-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [
    startDate,
    endDate,
    selectedTestIds,
    invitationType,
    minCognitive,
    maxCognitive,
  ]);

  // Prepare correlation matrix for visualization
  const correlationMatrixData = useMemo(() => {
    if (!data) return [];

    const dimensions = [
      ...new Set([
        ...data.correlationMatrix.map((c) => c.dimension1),
        ...data.correlationMatrix.map((c) => c.dimension2),
      ]),
    ];

    return dimensions.map((dim1) => {
      const row: any = { dimension: dim1 };
      dimensions.forEach((dim2) => {
        if (dim1 === dim2) {
          row[dim2] = 1;
        } else {
          const correlation = data.correlationMatrix.find(
            (c) =>
              (c.dimension1 === dim1 && c.dimension2 === dim2) ||
              (c.dimension1 === dim2 && c.dimension2 === dim1)
          );
          row[dim2] = correlation ? correlation.correlation : 0;
        }
      });
      return row;
    });
  }, [data]);

  // Prepare trend data for visualization
  const trendChartData = useMemo(() => {
    if (!data) return [];

    const monthlyData = new Map<string, any>();

    data.trendData.forEach((trend) => {
      if (!monthlyData.has(trend.date)) {
        monthlyData.set(trend.date, { date: trend.date });
      }
      monthlyData.get(trend.date)![trend.dimensionCode] = trend.averageScore;
    });

    return Array.from(monthlyData.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-600">
            No Data Available
          </h1>
          <p className="text-gray-500">
            No personality assessment data found with the current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Personality Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Analyze personality assessment data across{' '}
                {data.summary.totalAttempts} test attempts
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                Export CSV
              </button>
              <button
                onClick={() => router.push('/admin/analytics')}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              >
                Back to Analytics
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={invitationType}
                onChange={(e) => setInvitationType(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="invitation">Invitations</option>
                <option value="public">Public Links</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min Cognitive %
              </label>
              <input
                type="number"
                value={minCognitive}
                onChange={(e) => setMinCognitive(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Cognitive %
              </label>
              <input
                type="number"
                value={maxCognitive}
                onChange={(e) => setMaxCognitive(e.target.value)}
                placeholder="100"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="text-2xl font-bold text-blue-900">
                {data.summary.totalAttempts}
              </div>
              <div className="text-blue-600">Total Attempts</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-2xl font-bold text-green-900">
                {data.summary.uniqueDimensions}
              </div>
              <div className="text-green-600">Dimensions</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <div className="text-2xl font-bold text-purple-900">
                {data.summary.uniqueTests}
              </div>
              <div className="text-purple-600">Unique Tests</div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4">
              <div className="text-2xl font-bold text-orange-900">
                {data.dimensionAnalytics.length > 0
                  ? Math.round(
                      data.dimensionAnalytics.reduce(
                        (sum, d) => sum + d.sampleCount,
                        0
                      ) / data.dimensionAnalytics.length
                    )
                  : 0}
              </div>
              <div className="text-orange-600">Avg Sample Size</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 rounded-lg bg-white shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'dimensions', name: 'Dimensions' },
                { id: 'correlations', name: 'Correlations' },
                { id: 'trends', name: 'Trends' },
                { id: 'comparison', name: 'Cognitive Comparison' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Dimension Summary */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Dimension Averages
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dimensionAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dimensionCode"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[1, 5]} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value.toFixed(2),
                        'Average Score',
                      ]}
                      labelFormatter={(label: string) => {
                        const dim = data.dimensionAnalytics.find(
                          (d) => d.dimensionCode === label
                        );
                        return dim?.dimensionName || label;
                      }}
                    />
                    <Bar dataKey="averageScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension Popularity */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Dimension Popularity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.dimensionPopularity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.dimension.split(' ')[0]}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sampleCount"
                    >
                      {data.dimensionPopularity.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value,
                        'Sample Count',
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'dimensions' && (
            <div className="space-y-6">
              {data.dimensionAnalytics.map((dimension) => (
                <div
                  key={dimension.dimensionCode}
                  className="rounded-lg bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dimension.dimensionName}
                      </h3>
                      <p className="text-gray-600">
                        Average: {dimension.averageScore.toFixed(2)} | Sample:{' '}
                        {dimension.sampleCount} | Tests: {dimension.testCount}
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dimension.distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scoreRange" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value.toFixed(1)}%`,
                          'Percentage',
                        ]}
                      />
                      <Bar dataKey="percentage" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'correlations' && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Dimension Correlations
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Dimension 1
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Dimension 2
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Correlation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sample Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Strength
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.correlationMatrix
                      .sort(
                        (a, b) =>
                          Math.abs(b.correlation) - Math.abs(a.correlation)
                      )
                      .map((correlation, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {correlation.dimension1}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {correlation.dimension2}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                Math.abs(correlation.correlation) > 0.5
                                  ? 'text-red-600'
                                  : Math.abs(correlation.correlation) > 0.3
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {correlation.correlation.toFixed(3)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {correlation.sampleSize}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {Math.abs(correlation.correlation) > 0.7
                              ? 'Strong'
                              : Math.abs(correlation.correlation) > 0.5
                                ? 'Moderate'
                                : Math.abs(correlation.correlation) > 0.3
                                  ? 'Weak'
                                  : 'Very Weak'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'trends' && data.trendData.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Score Trends Over Time
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 5]} />
                  <Tooltip />
                  <Legend />
                  {[...new Set(data.trendData.map((t) => t.dimensionCode))].map(
                    (dimensionCode, index) => (
                      <Line
                        key={dimensionCode}
                        type="monotone"
                        dataKey={dimensionCode}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                High vs Low Cognitive Performance (70% threshold)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.cognitiveComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dimension"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[1, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="highCognitive"
                    fill="#8884d8"
                    name="High Cognitive (≥70%)"
                  />
                  <Bar
                    dataKey="lowCognitive"
                    fill="#82ca9d"
                    name="Low Cognitive (<70%)"
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <h4 className="text-md mb-3 font-medium text-gray-900">
                  Significant Differences
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Dimension
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          High Cognitive Avg
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Low Cognitive Avg
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Difference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {data.cognitiveComparison.map((comparison, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {comparison.dimension}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {comparison.highCognitive.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {comparison.lowCognitive.toFixed(2)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                Math.abs(comparison.difference) > 0.5
                                  ? 'text-red-600'
                                  : Math.abs(comparison.difference) > 0.2
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {comparison.difference > 0 ? '+' : ''}
                              {comparison.difference.toFixed(2)}
                            </span>
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
      </div>
    </div>
  );
}
