'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  LogOut,
  Settings,
  ChevronDown,
  User,
  Menu,
  X,
  Building2,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
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
    { name: 'Job Profiles', href: '/admin/job-profiles', icon: Building2 },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Top Navigation */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 justify-between">
            {/* Logo - More Compact */}
            <div className="flex items-center">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 transition-opacity hover:opacity-80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">
                    Test Platform
                  </h1>
                </div>
              </Link>
            </div>

            {/* Navigation Links - Compact */}
            <div className="hidden items-center space-x-1 md:flex">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu - Compact */}
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 md:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {session?.user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="hidden text-left lg:block">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.user.role}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <div className="border-b border-gray-100 px-4 py-2 lg:hidden">
                          <p className="text-sm font-medium text-gray-900">
                            {session.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.user.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut({ callbackUrl: '/login' });
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-md px-3 py-2 text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main content - Reduced padding */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
