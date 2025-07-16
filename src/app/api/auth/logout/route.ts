import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 200 }
      );
    }

    // Create response with cleared cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear all auth-related cookies
    const cookiesToClear = [
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.csrf-token',
      '__Host-csrf-token', // Our custom CSRF token
      'next-auth.session-token', // Legacy cookie name
      'next-auth.callback-url', // Legacy cookie name
      'next-auth.csrf-token', // Legacy cookie name
    ];

    cookiesToClear.forEach((cookieName) => {
      response.cookies.set({
        name: cookieName,
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
