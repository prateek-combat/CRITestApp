'use client';

import { fetchWithCSRF } from '@/lib/csrf';
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
  Plus,
  Trophy,
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetchWithCSRF('/api/admin/dashboard-stats'),
          fetchWithCSRF('/api/admin/activity-feed'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          console.error('Failed to fetch stats');
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData);
        } else {
          console.error('Failed to fetch activities');
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
    <div className="flex items-center rounded-lg border border-ink/10 bg-parchment/80 p-4 shadow-sm">
      <div className={`rounded-full p-3 ${color}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm text-ink/50">{title}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
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
      className="flex flex-col items-center justify-center rounded-lg border border-ink/10 bg-parchment p-4 text-center shadow-sm transition-colors hover:bg-parchment/90"
    >
      {icon}
      <p className="mt-2 text-sm font-medium text-ink/70">{title}</p>
    </Link>
  );

  const ActivityIcon = ({ type }: { type: string }) => {
    const icons: { [key: string]: React.ReactNode } = {
      'Test Created': <FileText className="h-4 w-4 text-slateblue" />,
      'Invitation Sent': <Mail className="h-4 w-4 text-copper" />,
      'Test Completed': <CheckCircle className="h-4 w-4 text-moss" />,
    };
    return (
      <div className="rounded-full bg-parchment/90 p-2">
        {icons[type] || <FileText className="h-4 w-4 text-ink/50" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slateblue/50"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink/60">
            Welcome back! Here&apos;s an overview of your test platform.
          </p>
        </div>

        <InfoPanel
          title="🚀 Getting Started Guide"
          variant="neutral"
          dismissible={true}
        >
          <p>
            Use this dashboard to get a quick glance at your platform&apos;s
            activity. You can create new tests, manage job profiles, and view
            detailed analytics all from one place.
          </p>
        </InfoPanel>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tests"
            value={stats?.totalTests ?? 0}
            icon={<FileText className="h-6 w-6 text-slateblue" />}
            color="bg-slateblue/12"
          />
          <StatCard
            title="Active Tests"
            value={stats?.activeTests ?? 0}
            icon={<CheckCircle className="h-6 w-6 text-moss" />}
            color="bg-moss/12"
          />
          <StatCard
            title="Total Attempts"
            value={stats?.totalAttempts ?? 0}
            icon={<Users className="h-6 w-6 text-slateblue" />}
            color="bg-slateblue/12"
          />
          <StatCard
            title="Invitations"
            value={stats?.totalInvitations ?? 0}
            icon={<Mail className="h-6 w-6 text-copper" />}
            color="bg-copper/12"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-ink/10 bg-parchment/80 p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <QuickActionButton
                href="/admin/tests/new"
                title="Create Test"
                icon={<Plus className="h-8 w-8 text-slateblue" />}
              />
              <QuickActionButton
                href="/admin/job-profiles"
                title="Job Profiles"
                icon={<Briefcase className="h-8 w-8 text-copper" />}
              />
              <QuickActionButton
                href="/admin/leaderboard"
                title="Leaderboard"
                icon={<Trophy className="h-8 w-8 text-moss" />}
              />
              <QuickActionButton
                href="/admin/users"
                title="Manage Users"
                icon={<Users className="h-8 w-8 text-slateblue" />}
              />
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-parchment/80 p-6 shadow-sm lg:col-span-1 lg:row-span-2">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Recent Activity
            </h2>
            <div className="max-h-[400px] space-y-4 overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <Link
                    href={activity.link}
                    key={index}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-parchment"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1">
                      <p className="text-sm text-ink">{activity.description}</p>
                      <p className="text-xs text-ink/50">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-ink/50">
                  No recent activity found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
