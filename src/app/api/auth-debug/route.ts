import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugKey = searchParams.get('key');

  // Only allow with correct debug key
  const hasDebugKey = debugKey === 'debug-oauth-2024';

  if (!hasDebugKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Check NextAuth configuration
    const googleProvider = authOptions.providers.find((p) => p.id === 'google');

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
      googleProviderConfigured: !!googleProvider,
      authOptionsPages: authOptions.pages,
      authOptionsCallbacks: Object.keys(authOptions.callbacks || {}),
      providersCount: authOptions.providers.length,
      providerTypes: authOptions.providers.map((p) => ({
        id: p.id,
        type: p.type,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check auth configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
