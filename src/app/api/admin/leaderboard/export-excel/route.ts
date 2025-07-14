import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clone the URL to modify it
    const leaderboardUrl = new URL(request.url);

    // Replace the pathname to call the main leaderboard API
    leaderboardUrl.pathname = '/api/admin/leaderboard';

    // Set pageSize to a very large number to get all results
    leaderboardUrl.searchParams.set('pageSize', '10000');
    leaderboardUrl.searchParams.delete('page'); // Remove pagination

    // Forward the request to the main leaderboard API
    const response = await fetch(leaderboardUrl.toString(), {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard data');
    }

    const data = await response.json();

    // Return only the rows (the actual candidate data)
    return NextResponse.json(data.rows || []);
  } catch (error) {
    console.error('Error fetching leaderboard data for Excel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
