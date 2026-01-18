import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { UserRole } from '@prisma/client';
import { prisma } from './prisma';
import { authLogger } from './logger';

// JWT-only auth configuration optimized for serverless environments
// Avoids Prisma adapter dependency for better cold start performance
export const authOptionsSimple: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in database with admin role
          const dbUser = await prisma.user.findFirst({
            where: {
              email: user.email,
              role: {
                in: ['ADMIN', 'SUPER_ADMIN'],
              },
            },
          });

          if (dbUser) {
            // User is authorized admin
            (user as any).role = dbUser.role;
            (user as any).dbId = dbUser.id;
            (user as any).firstName = dbUser.firstName;
            (user as any).lastName = dbUser.lastName;
            return true;
          }

          // User not found in admin database
          authLogger.warn('Unauthorized Google login attempt', {
            email: user.email,
            provider: 'google',
          });
          return false;
        } catch (error) {
          authLogger.error(
            'Error checking user in database during Google sign-in',
            {
              email: user.email,
              provider: 'google',
            },
            error as Error
          );
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role || 'USER';
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.name =
          token.firstName && token.lastName
            ? `${token.firstName} ${token.lastName}`.trim()
            : session.user.name;
      }
      return session;
    },
  },
};
