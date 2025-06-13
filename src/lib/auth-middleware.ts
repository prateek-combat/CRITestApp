/**
 * Authentication Middleware
 * Reusable authentication checks for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Check if the request is from an authenticated admin user
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user?: AuthenticatedUser; error?: NextResponse }> {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        ),
      };
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return {
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      };
    }

    if (user.role !== 'ADMIN') {
      return {
        error: NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if the request is from any authenticated user
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user?: AuthenticatedUser; error?: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        ),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return {
        error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Optional auth error:', error);
    return null;
  }
}
