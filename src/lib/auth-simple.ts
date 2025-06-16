import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { UserRole } from '@prisma/client';

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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        // Local admin login for development and testing
        if (
          credentials?.email === 'local-admin' &&
          credentials?.password === 'local-admin'
        ) {
          return {
            id: 'local-admin-id',
            email: 'admin@local.dev',
            name: 'Local Admin',
            role: 'SUPER_ADMIN',
          };
        }

        // All other credentials authentication is disabled
        // Users should use Google OAuth
        return null;
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
        // Only allow prateek@combatrobotics.in for Google OAuth
        if (user.email === 'prateek@combatrobotics.in') {
          (user as any).role = 'SUPER_ADMIN';
          (user as any).dbId = 'prateek-admin-id';
          return true;
        }

        // Reject all other Google accounts
        return false;
      }

      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role || 'USER';
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
