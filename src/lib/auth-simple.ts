import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        // Note: For local development, create a proper admin user in the database
        // using the setup scripts provided in the scripts/ directory
        // Example: npm run setup:admin

        // All other credentials authentication is disabled
        // Users should use Google OAuth
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours - more secure than 30 days
    updateAge: 60 * 60, // Update session every hour if active
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.callback-url`
          : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Host-next-auth.csrf-token`
          : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === 'google') {
        try {
          // In development, cache admin users for faster lookups
          const isDevelopment = process.env.NODE_ENV === 'development';

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
            // User is authorized admin - store all data in user object
            (user as any).role = dbUser.role;
            (user as any).dbId = dbUser.id;
            (user as any).firstName = dbUser.firstName;
            (user as any).lastName = dbUser.lastName;
            (user as any).isAdmin = true; // Cache admin status
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
    async jwt({ token, user, trigger }: any) {
      if (user) {
        // Initial sign in - store all user data in token
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role || 'USER';
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.isAdmin = (user as any).isAdmin || false;
        token.lastActivity = Date.now();
        token.email = user.email; // Store email for quick access
      }

      // Check for session timeout (2 hours of inactivity)
      if (token.lastActivity) {
        const inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
        if (Date.now() - token.lastActivity > inactivityTimeout) {
          // Session expired due to inactivity
          return null;
        }
      }

      // Update last activity only periodically, not on every request
      if (trigger === 'update' && token.lastActivity) {
        const timeSinceLastUpdate = Date.now() - token.lastActivity;
        // Only update if more than 5 minutes have passed
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
          token.lastActivity = Date.now();
        }
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
