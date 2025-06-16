import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { debugServer } from '@/app/api/debug-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const debugKey = searchParams.get('key');

  // Simple security check
  if (debugKey !== 'debug-oauth-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  debugServer('🔍 Starting comprehensive auth debug');

  try {
    // Get current session
    const session = await getServerSession(authOptions);

    debugServer('📋 Session check result:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      expires: session?.expires,
    });

    // Environment variables check
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL,
    };

    debugServer('🔧 Environment variables:', envCheck);

    // Database connectivity check
    let dbCheck = { connected: false, userCount: 0, testUserExists: false };
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      const testUser = await prisma.user.findUnique({
        where: { email: 'test@test.com' },
      });

      dbCheck = {
        connected: true,
        userCount,
        testUserExists: !!testUser,
      };

      debugServer('🗄️ Database check:', dbCheck);
    } catch (dbError) {
      debugServer('💥 Database error:', dbError);
      dbCheck = { connected: false, userCount: 0, testUserExists: false };
    }

    // Headers check
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      cookie: request.headers.get('cookie') ? 'Present' : 'Not present',
    };

    debugServer('📡 Request headers:', headers);

    // Cookie analysis
    const cookies = request.headers.get('cookie');
    const cookieAnalysis = {
      hasCookies: !!cookies,
      hasSessionToken: cookies?.includes('next-auth.session-token') || false,
      hasCallbackUrl: cookies?.includes('next-auth.callback-url') || false,
      hasCsrfToken: cookies?.includes('next-auth.csrf-token') || false,
      cookieCount: cookies ? cookies.split(';').length : 0,
    };

    debugServer('🍪 Cookie analysis:', cookieAnalysis);

    // NextAuth configuration check
    const authConfig = {
      providersCount: authOptions.providers.length,
      hasCredentialsProvider: authOptions.providers.some(
        (p) => p.id === 'credentials'
      ),
      hasGoogleProvider: authOptions.providers.some((p) => p.id === 'google'),
      sessionStrategy: authOptions.session?.strategy,
      sessionMaxAge: authOptions.session?.maxAge,
      hasSecret: !!authOptions.secret,
      pagesSignIn: authOptions.pages?.signIn,
      debugEnabled: authOptions.debug,
    };

    debugServer('⚙️ NextAuth configuration:', authConfig);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      session,
      environment: envCheck,
      database: dbCheck,
      headers,
      cookies: cookieAnalysis,
      authConfig,
      url: request.url,
      method: request.method,
    };

    debugServer('📊 Complete debug info compiled');

    return NextResponse.json(debugInfo);
  } catch (error) {
    debugServer('💥 Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
