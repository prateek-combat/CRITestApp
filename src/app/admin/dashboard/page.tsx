'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  FileText,
  Mail,
  Users,
  BarChart3,
  Plus,
  Activity,
  Send,
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button/Button';
import Skeleton from '@/components/ui/Skeleton';
import { designSystem, componentStyles } from '@/lib/design-system';

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

const StatCard = ({ icon: Icon, title, value, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className={componentStyles.card}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`${designSystem.text.small} mb-1`}>{title}</p>
          <motion.p
            className="text-2xl font-bold text-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
        </div>
        <div
          className={`rounded-lg p-2.5 ${color} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  </motion.div>
);

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
  const [animationParent] = useAutoAnimate();

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

  const quickActions = [
    {
      href: '/admin/tests/new',
      label: 'Create Test',
      icon: Plus,
      color: 'text-military-green',
    },
    {
      href: '/admin/tests',
      label: 'Manage Tests',
      icon: FileText,
      color: 'text-accent-orange',
    },
    {
      href: '/admin/analytics',
      label: 'View Analytics',
      icon: BarChart3,
      color: 'text-military-green',
    },
    {
      href: '/admin/users',
      label: 'Manage Users',
      icon: Users,
      color: 'text-accent-orange',
    },
  ];

  return (
    <div className={componentStyles.pageContainer}>
      <div className={componentStyles.contentWrapper}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={designSystem.gaps.section}
        >
          <h1 className={designSystem.text.pageTitle}>Dashboard</h1>
          <p className={designSystem.text.pageSubtitle}>
            Welcome back to Test Platform
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={100}
                  className="rounded-xl"
                />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon={FileText}
                title="Total Tests"
                value={stats.totalTests}
                color="bg-gradient-to-br from-military-green to-primary-600"
                delay={0}
              />
              <StatCard
                icon={CheckCircle}
                title="Active Tests"
                value={stats.activeTests}
                color="bg-gradient-to-br from-green-500 to-green-600"
                delay={0.1}
              />
              <StatCard
                icon={Users}
                title="Total Attempts"
                value={stats.totalAttempts}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                delay={0.2}
              />
              <StatCard
                icon={TrendingUp}
                title="Completion Rate"
                value={`${stats.completionRate}%`}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={`${componentStyles.card} mb-6`}>
            <h2 className={`${designSystem.text.sectionTitle} mb-4`}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <Link href={action.href}>
                    <motion.div
                      className={`flex items-center justify-between rounded-lg p-3 ${designSystem.borders.default} group cursor-pointer transition-all hover:border-military-green/30 hover:bg-military-green/5`}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <action.icon className={`h-4 w-4 ${action.color}`} />
                        <span className={designSystem.text.body}>
                          {action.label}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-military-green" />
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className={componentStyles.card}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className={designSystem.text.sectionTitle}>
                Recent Activity
              </h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>

            <div ref={animationParent} className="space-y-2">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="circular" width={32} height={32} />
                      <div className="flex-1 space-y-1">
                        <Skeleton variant="text" width="75%" />
                        <Skeleton variant="text" width="50%" height={12} />
                      </div>
                    </div>
                  ))}
                </>
              ) : recentActivity.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Activity className="mx-auto mb-2 h-12 w-12 opacity-20" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-military-green/10 to-accent-orange/10">
                      <Clock className="h-4 w-4 text-military-green" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`${designSystem.text.body} truncate`}>
                        {activity.description}
                      </p>
                      <p className={designSystem.text.small}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
