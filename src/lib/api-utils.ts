import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSRFToken,
  getCSRFTokenFromCookie,
  setCSRFCookie,
  validateCSRFToken,
} from './csrf';
import { getToken } from 'next-auth/jwt';

export type ApiHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper for API routes that adds CSRF protection and error handling
 */
export function withApiProtection(handler: ApiHandler) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Skip CSRF for GET/HEAD requests
      if (!['GET', 'HEAD'].includes(req.method)) {
        const isValid = await validateCSRFToken(req);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // Execute the handler
      const response = await handler(req, context);

      // Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');

      // Ensure authenticated users have a CSRF cookie
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (token && !getCSRFTokenFromCookie(req)) {
        setCSRFCookie(response, generateCSRFToken());
      }

      return response;
    } catch (error) {
      console.error('API error:', error);

      // Don't expose internal errors in production
      const response = NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : error instanceof Error
                ? error.message
                : 'Unknown error',
        },
        { status: 500 }
      );

      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');

      return response;
    }
  };
}

/**
 * Extract user from request headers (set by middleware)
 */
export function getUserFromRequest(req: NextRequest) {
  return {
    id: req.headers.get('x-user-id') || undefined,
    role: req.headers.get('x-user-role') || undefined,
    email: req.headers.get('x-user-email') || undefined,
  };
}

/**
 * Verify request is from authenticated admin
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ error?: string; user?: any }> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return { error: 'Authentication required' };
  }

  if (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
    return { error: 'Admin access required' };
  }

  return { user: token };
}
