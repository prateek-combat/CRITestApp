import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugKey = searchParams.get('key');

  // Only allow in development or with correct debug key
  const isDev = process.env.NODE_ENV === 'development';
  const hasDebugKey = debugKey === 'debug-oauth-2024';

  if (!isDev && !hasDebugKey) {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    googleClientIdPrefix:
      process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
  });
}
