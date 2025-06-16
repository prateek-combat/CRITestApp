import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const debugKey = searchParams.get('key');

  // Simple security check
  if (debugKey !== 'debug-oauth-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextauthUrl: process.env.NEXTAUTH_URL,
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    };

    // Get session info
    const session = await auth();

    // Test database connection
    let dbStatus = 'DISCONNECTED';
    let testUser = null;
    try {
      testUser = await prisma.user.findFirst({
        where: { email: 'test@test.com' },
        select: { id: true, email: true, role: true },
      });
      dbStatus = 'CONNECTED';
    } catch (error) {
      dbStatus = `ERROR: ${(error as Error).message}`;
    }

    // Get request info
    const requestInfo = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      hasCookies: request.headers.get('cookie') ? true : false,
      hasSessionToken:
        request.headers.get('cookie')?.includes('next-auth.session-token') ||
        false,
    };

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      session: session
        ? {
            user: session.user,
            expires: session.expires,
          }
        : null,
      database: {
        status: dbStatus,
        testUser: testUser,
      },
      request: requestInfo,
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
