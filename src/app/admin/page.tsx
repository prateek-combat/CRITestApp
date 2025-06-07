'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalTests: number;
  totalInvitations: number;
  totalAttempts: number;
  averageScore: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalInvitations: 0,
    totalAttempts: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic stats from your APIs
      const [testsRes, invitationsRes, attemptsRes] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/invitations'),
        fetch('/api/test-attempts'),
      ]);

      const tests = await testsRes.json();
      const invitations = await invitationsRes.json();
      const attempts = await attemptsRes.json();

      // Calculate average score
      const completedAttempts = attempts.filter(
        (attempt: any) => attempt.status === 'COMPLETED'
      );
      const avgScore = completedAttempts.length
        ? completedAttempts.reduce(
            (sum: number, attempt: any) => sum + attempt.score,
            0
          ) / completedAttempts.length
        : 0;

      setStats({
        totalTests: tests.length,
        totalInvitations: invitations.length,
        totalAttempts: attempts.length,
        averageScore: Math.round(avgScore * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-lg p-3 ${color}`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your Test Platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tests"
          value={stats.totalTests}
          color="bg-brand-100 text-brand-600"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <StatCard
          title="Invitations Sent"
          value={stats.totalInvitations}
          color="bg-orange-100 text-orange-600"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
        />
        <StatCard
          title="Test Attempts"
          value={stats.totalAttempts}
          color="bg-success-100 text-success-600"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          color="bg-warning-100 text-warning-600"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/tests/new"
            className="flex items-center rounded-lg border border-brand-200 bg-brand-50 p-4 transition-colors hover:bg-brand-100"
          >
            <div className="flex-shrink-0 rounded-lg bg-brand-500 p-2">
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-brand-900">
                Create New Test
              </p>
              <p className="text-sm text-brand-600">Set up a new assessment</p>
            </div>
          </a>

          <a
            href="/admin/tests"
            className="flex items-center rounded-lg border border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100"
          >
            <div className="flex-shrink-0 rounded-lg bg-orange-500 p-2">
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-900">
                Manage Tests
              </p>
              <p className="text-sm text-orange-600">
                View and edit existing tests
              </p>
            </div>
          </a>

          <a
            href="/admin/analytics"
            className="bg-success-50 border-success-200 hover:bg-success-100 flex items-center rounded-lg border p-4 transition-colors"
          >
            <div className="bg-success-500 flex-shrink-0 rounded-lg p-2">
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-success-900 text-sm font-medium">
                View Analytics
              </p>
              <p className="text-success-600 text-sm">Analyze test results</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="bg-success-500 mr-3 h-2 w-2 rounded-full"></div>
            <span className="text-gray-600">
              System ready for new test administrations
            </span>
          </div>
          <div className="flex items-center text-sm">
            <div className="mr-3 h-2 w-2 rounded-full bg-brand-500"></div>
            <span className="text-gray-600">
              Dashboard updated with latest statistics
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
