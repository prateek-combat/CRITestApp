'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InfoPanel from '@/components/ui/InfoPanel';
import {
  FileText,
  Mail,
  CheckCircle,
  BarChart2,
  Briefcase,
  Users,
  Eye,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  type: string;
  timestamp: string;
  description: string;
  link: string;
}

interface DashboardStats {
  totalTests: number;
  activeTests: number;
  totalAttempts: number;
  totalInvitations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/admin/dashboard-stats'),
          fetch('/api/admin/activity-feed'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`rounded-full p-3 ${color}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  const QuickActionButton = ({
    href,
    title,
    icon,
  }: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }) => (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4 text-center shadow-sm transition-colors hover:bg-gray-100"
    >
      {icon}
      <p className="mt-2 text-sm font-medium text-gray-700">{title}</p>
    </Link>
  );

  const ActivityIcon = ({ type }: { type: string }) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Test Created': <FileText className="h-4 w-4 text-blue-500" />,
      'Invitation Sent': <Mail className="h-4 w-4 text-orange-500" />,
      'Test Completed': <CheckCircle className="h-4 w-4 text-green-500" />,
    };
    return (
      <div className="rounded-full bg-gray-100 p-2">
        {icons[type] || <FileText className="h-4 w-4 text-gray-500" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back! Here's an overview of your test platform.
          </p>
        </div>

        <InfoPanel
          title="🚀 Getting Started Guide"
          variant="neutral"
          dismissible={true}
        >
          <p>
            Use this dashboard to get a quick glance at your platform's
            activity. You can create new tests, manage job profiles, and view
            detailed analytics all from one place.
          </p>
        </InfoPanel>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tests"
            value={stats?.totalTests ?? 0}
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <StatCard
            title="Active Tests"
            value={stats?.activeTests ?? 0}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            color="bg-green-100"
          />
          <StatCard
            title="Total Attempts"
            value={stats?.totalAttempts ?? 0}
            icon={<Users className="h-6 w-6 text-purple-600" />}
            color="bg-purple-100"
          />
          <StatCard
            title="Invitations"
            value={stats?.totalInvitations ?? 0}
            icon={<Mail className="h-6 w-6 text-orange-600" />}
            color="bg-orange-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <QuickActionButton
                  href="/admin/tests/new"
                  title="Create Test"
                  icon={<Plus className="h-8 w-8 text-blue-500" />}
                />
                <QuickActionButton
                  href="/admin/job-profiles"
                  title="Job Profiles"
                  icon={<Briefcase className="h-8 w-8 text-orange-500" />}
                />
                <QuickActionButton
                  href="/admin/leaderboard"
                  title="View Leaderboard"
                  icon={<BarChart2 className="h-8 w-8 text-green-500" />}
                />
                <QuickActionButton
                  href="/admin/users"
                  title="Manage Users"
                  icon={<Users className="h-8 w-8 text-purple-500" />}
                />
              </div>
            </div>
          </div>

          <div className="lg:row-span-2">
            <div className="h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <Link
                      href={activity.link}
                      key={index}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <ActivityIcon type={activity.type} />
                      <div>
                        <p className="text-sm text-gray-800">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No recent activity found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
