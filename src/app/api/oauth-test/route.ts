import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debugKey = searchParams.get('key');

  if (debugKey !== 'debug-oauth-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Test the Google OAuth URL construction
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;

    if (!googleClientId || !nextAuthUrl || !nextAuthSecret) {
      return NextResponse.json(
        {
          error: 'Missing required environment variables',
          missing: {
            googleClientId: !googleClientId,
            nextAuthUrl: !nextAuthUrl,
            nextAuthSecret: !nextAuthSecret,
          },
        },
        { status: 500 }
      );
    }

    // Construct the Google OAuth URL manually
    const callbackUrl = `${nextAuthUrl}/api/auth/callback/google`;
    const state = 'test-state';
    const googleAuthUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );

    googleAuthUrl.searchParams.set('client_id', googleClientId);
    googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('access_type', 'offline');

    return NextResponse.json({
      status: 'OAuth configuration test',
      environment: process.env.NODE_ENV,
      nextAuthUrl,
      googleClientId: googleClientId.substring(0, 20) + '...',
      callbackUrl,
      constructedGoogleUrl: googleAuthUrl.toString(),
      nextAuthSigninUrl: `${nextAuthUrl}/api/auth/signin/google`,
      test: 'All environment variables present',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to test OAuth configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
