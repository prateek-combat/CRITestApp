import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { authLogger } from './logger';

export const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        // Special case for local development - admin login with no credentials
        if (
          process.env.NODE_ENV === 'development' &&
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

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name:
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              user.email,
            role: user.role,
          };
        } catch (error) {
          authLogger.error(
            'Credentials authentication failed',
            {
              email: credentials.email,
              provider: 'credentials',
            },
            error as Error
          );
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      authLogger.info('Sign-in attempt', {
        provider: account?.provider,
        email: user.email,
        name: user.name,
      });

      if (account?.provider === 'google') {
        // Only allow prateek@combatrobotics.in for Google OAuth
        if (user.email === 'prateek@combatrobotics.in') {
          authLogger.info('Authorized Google sign-in for Prateek', {
            email: user.email,
            provider: 'google',
            authorized: true,
          });
          (user as any).role = 'SUPER_ADMIN';
          (user as any).dbId = 'b2585d8d-02e4-4355-95a4-9d28cc92b81e';
          return true;
        }

        // Reject all other Google accounts
        authLogger.warn('Google sign-in rejected - unauthorized email', {
          email: user.email,
          provider: 'google',
          authorized: false,
        });
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Use database ID if available, otherwise use the provider ID
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
