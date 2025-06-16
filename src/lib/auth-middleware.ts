/**
 * Authentication Middleware
 * Reusable authentication checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from './prisma';
import { authLogger } from './logger';
import { auth } from './auth';

// Define admin roles
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}

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

/**
 * Middleware to check if user has super admin access
 * @param request - The incoming request
 * @returns Response or null if authorized
 */
export async function requireSuperAdminAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      authLogger.warn('Super admin access denied - no session', {
        path: request.nextUrl.pathname,
        method: request.method,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      authLogger.warn('Super admin access denied - insufficient role', {
        path: request.nextUrl.pathname,
        method: request.method,
        userRole: session.user.role,
        userId: session.user.id,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    authLogger.info('Super admin access granted', {
      path: request.nextUrl.pathname,
      method: request.method,
      userRole: session.user.role,
      userId: session.user.id,
    });

    return null; // Authorized
  } catch (error) {
    authLogger.error(
      'Super admin auth middleware error',
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

/**
 * Get current user session with error handling
 * @returns Session or null
 */
export async function getCurrentSession() {
  try {
    const session = await auth();
    return session;
  } catch (error) {
    authLogger.error('Failed to get current session', {}, error as Error);
    return null;
  }
}

/**
 * Check if user has specific role
 * @param requiredRole - The role to check for
 * @returns boolean
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const session = await auth();
    return session?.user?.role === requiredRole;
  } catch (error) {
    authLogger.error(
      'Failed to check user role',
      { requiredRole },
      error as Error
    );
    return false;
  }
}

/**
 * Check if user has admin privileges
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    return session?.user ? ADMIN_ROLES.includes(session.user.role) : false;
  } catch (error) {
    authLogger.error('Failed to check admin status', {}, error as Error);
    return false;
  }
}
