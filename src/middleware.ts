import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  generateCSRFToken,
  setCSRFCookie,
  getCSRFTokenFromCookie,
} from './lib/csrf';

// Define protected routes patterns
const protectedRoutes = {
  admin: /^\/admin/,
  api: {
    admin: /^\/api\/admin/,
    files: /^\/api\/files/,
    proctor: /^\/api\/proctor/,
    questions: /^\/api\/questions/,
    tests: /^\/api\/tests/,
    users: /^\/api\/users/,
  },
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/auth',
  '/api/health',
  '/api/public-test',
  '/api/public-test-attempts',
  '/api/public-test-links',
  '/api/invitations',
  '/api/job-profile-invitations',
  '/login',
  '/public-test',
  '/',
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    (pathname.includes('.') && // has file extension
      /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(pathname))
  ) {
    return NextResponse.next();
  }

  // Handle public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Check if user is authenticated even on public routes
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      // Generate CSRF token for authenticated users on public routes
      const response = NextResponse.next();

      if (!getCSRFTokenFromCookie(req)) {
        const csrfToken = generateCSRFToken();
        setCSRFCookie(response, csrfToken);
      }

      return response;
    }

    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute =
    protectedRoutes.admin.test(pathname) ||
    Object.values(protectedRoutes.api).some((pattern) =>
      pattern.test(pathname)
    );

  if (isProtectedRoute) {
    try {
      // Get the token from the request
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        // No valid session, redirect to login for admin pages
        if (pathname.startsWith('/admin')) {
          const loginUrl = new URL('/login', req.url);
          loginUrl.searchParams.set('callbackUrl', pathname);
          return NextResponse.redirect(loginUrl);
        }

        // For API routes, return 401
        if (pathname.startsWith('/api')) {
          return new NextResponse(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          );
        }
      }

      // Use cached isAdmin flag for quick check in development
      const isAdmin =
        process.env.NODE_ENV === 'development'
          ? token.isAdmin || ['ADMIN', 'SUPER_ADMIN'].includes(token.role)
          : token.role === 'ADMIN' || token.role === 'SUPER_ADMIN';

      // Check admin role for admin routes
      if (
        (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
        !isAdmin
      ) {
        // Redirect to unauthorized for web pages
        if (pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // Return 403 for API routes
        return new NextResponse(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }

      // Add user info to headers for downstream use
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', token.sub || '');
      requestHeaders.set('x-user-role', token.role || '');
      requestHeaders.set('x-user-email', token.email || '');

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      // Generate CSRF token only for state-changing requests or if not present
      if (
        !getCSRFTokenFromCookie(req) &&
        ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)
      ) {
        const csrfToken = generateCSRFToken();
        setCSRFCookie(response, csrfToken);
      }

      return response;
    } catch (error) {
      console.error('Middleware auth error:', error);

      // For API routes, return 500
      if (pathname.startsWith('/api')) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication error' }),
          { status: 500, headers: { 'content-type': 'application/json' } }
        );
      }

      // For web pages, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
