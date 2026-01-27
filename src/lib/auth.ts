import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptionsSimple } from './auth-simple';

// Use simplified JWT-only auth configuration
// This avoids Prisma adapter issues in serverless environments
export const getAuthConfig = () => authOptionsSimple;

export const auth = () => getServerSession(authOptionsSimple);

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    } as const;
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    } as const;
  }

  return { session } as const;
}
