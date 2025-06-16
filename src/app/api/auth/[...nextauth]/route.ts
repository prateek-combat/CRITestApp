import NextAuth from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

// Use simplified JWT-only auth configuration for both development and production
// This avoids Prisma adapter issues in serverless environments
const handler = NextAuth(authOptionsSimple);

export { handler as GET, handler as POST };
