'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeaderboardSidebarLayout from './_components/LeaderboardSidebarLayout';
import InfoPanel from '@/components/ui/InfoPanel';
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

        {/* Info Panel */}
        <InfoPanel
          title="📊 Understanding the Leaderboard"
          variant="info"
          dismissible={true}
        >
          <div className="space-y-2">
            <p>
              <strong>Leaderboard Features:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm">
              <li>Compare candidates across different tests and profiles</li>
              <li>Adjust scoring weights to match your criteria</li>
              <li>Export results as PDF reports</li>
              <li>Filter by job profiles and test types</li>
            </ul>
            <p className="text-sm font-medium text-blue-700">
              💡 Tip: Use the weight profiles to customize scoring for different
              roles!
            </p>
          </div>
        </InfoPanel>

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
