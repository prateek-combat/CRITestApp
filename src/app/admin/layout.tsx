'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AppHeader from '@/layout/AppHeader';

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

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader />
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
