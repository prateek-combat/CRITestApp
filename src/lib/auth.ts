import { getServerSession } from 'next-auth/next';
import { authOptionsSimple } from './auth-simple';

// Use simplified JWT-only auth configuration
// This avoids Prisma adapter issues in serverless environments
export const getAuthConfig = () => authOptionsSimple;

export const auth = () => getServerSession(authOptionsSimple);
