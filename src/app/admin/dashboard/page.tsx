'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Mail,
  Users,
  BarChart3,
  Plus,
  Activity,
  Send,
} from 'lucide-react';

interface DashboardStats {
  totalTests: number;
  totalInvitations: number;
  totalAttempts: number;
  completionRate: number;
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
    completionRate: 0,
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
          completionRate: data.completionRate,
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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="page-transition-modern-fade min-h-screen space-y-4 bg-gray-100 p-3 md:p-4 lg:p-6">
      <div className="smooth-reveal">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Welcome to Test Platform</p>
      </div>

      {/* Stats Cards */}
      <div className="page-transition-staggered grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tests Card */}
        <div className="card-hover micro-lift rounded-lg border border-gray-200 bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
                <svg
                  className="micro-bounce h-6 w-6 text-white"
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
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-500">Total Tests</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalTests}
              </p>
            </div>
          </div>
        </div>

        {/* Active Tests Card */}
        <div className="card-hover micro-scale rounded-lg border border-gray-200 bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                <svg
                  className="micro-rotate h-6 w-6 text-white"
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
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-500">Active Tests</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.activeTests}
              </p>
            </div>
          </div>
        </div>

        {/* Total Attempts Card */}
        <div className="card-hover micro-bounce rounded-lg border border-gray-200 bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                <svg
                  className="micro-scale h-6 w-6 text-white"
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
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-500">
                Total Attempts
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.totalAttempts}
              </p>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="card-hover micro-rotate rounded-lg border border-gray-200 bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                <svg
                  className="micro-lift h-6 w-6 text-white"
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
              </div>
            </div>
            <div className="ml-4">
              <p className="text-xs font-medium text-gray-500">
                Completion Rate
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/tests/new"
            className="magnetic-btn flex items-center rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            className="magnetic-btn flex items-center rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            className="magnetic-btn flex items-center rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            className="magnetic-btn flex items-center rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-4 w-4"
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-gray-500">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
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
