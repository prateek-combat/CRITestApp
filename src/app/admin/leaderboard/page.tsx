'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeaderboardSidebarLayout from './_components/LeaderboardSidebarLayout';
import { designSystem, componentStyles } from '@/lib/design-system';

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading session

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      router.push('/login');
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null; // Will redirect to login
  }

  return (
    <div className={componentStyles.pageContainer}>
      <div className={componentStyles.contentWrapper}>
        {/* Header - Compact */}
        <div className={designSystem.gaps.section}>
          <h1 className={designSystem.text.pageTitle}>Candidate Leaderboard</h1>
          <p className={designSystem.text.pageSubtitle}>
            View and compare candidate performance with configurable scoring
            weights
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-500"></div>
              <p className="ml-3 text-sm text-gray-600">
                Loading leaderboard...
              </p>
            </div>
          }
        >
          <LeaderboardSidebarLayout userRole={session.user.role} />
        </Suspense>
      </div>
    </div>
  );
}
