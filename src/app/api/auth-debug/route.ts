import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    return NextResponse.json({
      session: session,
      user: session?.user || null,
      role: session?.user?.role || null,
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      hasUser: !!session?.user,
      hasRole: !!session?.user?.role,
      isAdmin:
        session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
