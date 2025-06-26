'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalTests: number;
  totalInvitations: number;
  totalAttempts: number;
  activeTests: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalInvitations: 0,
    totalAttempts: 0,
    activeTests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics?range=30d');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalTests: data.totalTests,
          totalInvitations: data.totalInvitations,
          totalAttempts: data.totalAttempts,
          activeTests: data.activeTests,
        });
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back to Test Platform</p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Total Tests */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">
                Total Tests
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalTests}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Tests */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">
                Active Tests
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.activeTests}
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>

        {/* Total Attempts */}
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-600">
                Total Attempts
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalAttempts}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/tests/new"
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Test
          </Link>

          <Link
            href="/admin/tests"
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Manage Tests
          </Link>

          <Link
            href="/admin/analytics"
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            View Analytics
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-4 text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          Recent Activity
        </h2>
        {loading ? (
          <div className="text-gray-500">Loading activity...</div>
        ) : recentActivity.length === 0 ? (
          <div className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
            <p className="mt-2 text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 border-b border-gray-100 py-3 last:border-b-0"
              >
                <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
