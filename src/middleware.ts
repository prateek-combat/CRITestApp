import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default async function middleware(req: NextRequest) {
  // Only apply auth to admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
