/**
 * Authentication Middleware
 * Reusable authentication checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { authLogger } from './logger';
import { auth } from './auth';

// Define admin roles
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

/**
 * Middleware to check if user has admin access
 * @param request - The incoming request
 * @returns Response or null if authorized
 */
export async function requireAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      authLogger.warn('Admin access denied - no session', {
        path: request.nextUrl.pathname,
        method: request.method,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_ROLES.includes(session.user.role)) {
      authLogger.warn('Admin access denied - insufficient role', {
        path: request.nextUrl.pathname,
        method: request.method,
        userRole: session.user.role,
        userId: session.user.id,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    authLogger.info('Admin access granted', {
      path: request.nextUrl.pathname,
      method: request.method,
      userRole: session.user.role,
      userId: session.user.id,
    });

    return null; // Authorized
  } catch (error) {
    authLogger.error(
      'Admin auth middleware error',
      {
        path: request.nextUrl.pathname,
        method: request.method,
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}