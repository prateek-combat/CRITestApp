import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LeaderboardSidebarLayout from './_components/LeaderboardSidebarLayout';

interface LeaderboardPageProps {
  searchParams: Promise<{
    testId?: string;
    page?: string;
    pageSize?: string;
    dateFrom?: string;
    dateTo?: string;
    invitationId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/login');
  }

  // Await searchParams to comply with Next.js 15 requirements
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidate Leaderboard
          </h1>
          <p className="mt-2 text-gray-600">
            View and compare candidate performance rankings by test
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
              <p className="ml-3 text-gray-600">Loading leaderboard...</p>
            </div>
          }
        >
          <LeaderboardSidebarLayout searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Candidate Leaderboard - Test Platform',
  description: 'View and compare candidate performance rankings by test',
};
