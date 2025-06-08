'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  Mail,
  Trophy,
  Users,
  LayoutDashboard,
  Zap,
  Brain,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session && pathname !== '/admin/login') {
      router.push('/login');
      return;
    }

    // Check if user has admin role
    if (session && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      // User is authenticated but doesn't have admin privileges
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, pathname]);

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated and not on login page, don't render anything
  // (useEffect will redirect)
  if (!session && pathname !== '/admin/login') {
    return null;
  }

  // If authenticated but not admin role, don't render anything
  // (useEffect will redirect)
  if (session && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tests', href: '/admin/tests', icon: FileText },
    {
      name: 'Personality Dimensions',
      href: '/admin/personality-dimensions',
      icon: Brain,
    },
    { name: 'Invitations', href: '/admin/invitations', icon: Mail },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex w-64 flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white shadow-sm">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center px-4 py-6">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Test Platform
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
