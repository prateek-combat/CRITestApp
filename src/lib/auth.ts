import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { authLogger } from './logger';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
  adapter: PrismaAdapter(prisma),
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

          const authUser = {
            id: user.id,
            email: user.email,
            name:
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              user.email,
            role: user.role,
          };

          return authUser;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
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
    async jwt({ token, user }: any) {
      if (user) {
        // Use database ID if available, otherwise use the provider ID
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role;

        authLogger.debug('JWT CALLBACK', {
          hasUser: !!user,
          tokenId: token.id,
          tokenEmail: token.email,
          userRole: (user as any).role,
          timestamp: new Date().toISOString(),
        });
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;

        authLogger.debug('SESSION CALLBACK', {
          hasSession: !!session,
          hasUser: !!session.user,
          tokenId: token.id,
          tokenRole: token.role,
          sessionUserEmail: session.user.email,
          timestamp: new Date().toISOString(),
        });

        authLogger.debug('SESSION UPDATED', {
          userId: session.user.id,
          userRole: session.user.role,
          userEmail: session.user.email,
        });
      }
      return session;
    },
  },
  events: {
    async signIn(message: any) {
      authLogger.debug('SIGNIN EVENT', {
        hasUser: !!message.user,
        userEmail: message.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut(message: any) {
      authLogger.debug('SIGNOUT EVENT', {
        hasToken: !!message.token,
        hasSession: !!message.session,
        timestamp: new Date().toISOString(),
      });
    },
    async createUser(message: any) {
      authLogger.debug('CREATE USER EVENT', {
        hasUser: !!message.user,
        userEmail: message.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
    async session(message: any) {
      authLogger.debug('SESSION EVENT', {
        hasSession: !!message.session,
        userEmail: message.session?.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
  },
};

export default NextAuth(authOptions);

export const auth = () => getServerSession(authOptions);
