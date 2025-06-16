import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { authLogger } from './logger';
import { debugAuth } from './debug';

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'production', // Enable debug in production
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
        debugAuth('🔐 CREDENTIALS AUTHORIZE START', {
          hasCredentials: !!credentials,
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        });

        // Special case for local development - admin login with no credentials
        if (
          process.env.NODE_ENV === 'development' &&
          credentials?.email === 'local-admin' &&
          credentials?.password === 'local-admin'
        ) {
          debugAuth('🏠 LOCAL ADMIN LOGIN DETECTED', {});
          return {
            id: 'local-admin-id',
            email: 'admin@local.dev',
            name: 'Local Admin',
            role: 'SUPER_ADMIN',
          };
        }

        if (!credentials?.email || !credentials?.password) {
          debugAuth('❌ MISSING CREDENTIALS', {
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password,
          });
          return null;
        }

        try {
          debugAuth('🔍 SEARCHING FOR USER IN DATABASE', {
            email: credentials.email,
          });

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          debugAuth('👤 USER SEARCH RESULT', {
            userFound: !!user,
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            hasPasswordHash: !!user?.passwordHash,
          });

          if (!user) {
            debugAuth('❌ USER NOT FOUND', {});
            return null;
          }

          debugAuth('🔒 COMPARING PASSWORDS', {});
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          debugAuth('🔑 PASSWORD COMPARISON RESULT', {
            passwordMatch,
            providedPasswordLength: credentials.password.length,
            storedHashLength: user.passwordHash.length,
          });

          if (!passwordMatch) {
            debugAuth('❌ PASSWORD MISMATCH', {});
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

          debugAuth('✅ CREDENTIALS AUTHORIZE SUCCESS', authUser);
          return authUser;
        } catch (error) {
          debugAuth('💥 CREDENTIALS AUTHORIZE ERROR', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });

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
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
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
      debugAuth('🚪 SIGNIN CALLBACK START', {
        provider: account?.provider,
        email: user.email,
        name: user.name,
        userId: user.id,
        accountType: account?.type,
        timestamp: new Date().toISOString(),
      });

      authLogger.info('Sign-in attempt', {
        provider: account?.provider,
        email: user.email,
        name: user.name,
      });

      if (account?.provider === 'google') {
        debugAuth('🔍 GOOGLE OAUTH SIGNIN', {
          email: user.email,
          isAuthorizedEmail: user.email === 'prateek@combatrobotics.in',
        });

        // Only allow prateek@combatrobotics.in for Google OAuth
        if (user.email === 'prateek@combatrobotics.in') {
          debugAuth('✅ AUTHORIZED GOOGLE SIGNIN', { email: user.email });
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
        debugAuth('❌ UNAUTHORIZED GOOGLE EMAIL', { email: user.email });
        authLogger.warn('Google sign-in rejected - unauthorized email', {
          email: user.email,
          provider: 'google',
          authorized: false,
        });
        return false;
      }

      debugAuth('✅ SIGNIN CALLBACK SUCCESS', { provider: account?.provider });
      return true;
    },
    async jwt({ token, user }) {
      debugAuth('🎫 JWT CALLBACK', {
        hasUser: !!user,
        tokenId: token.id,
        tokenEmail: token.email,
        userRole: user ? (user as any).role : token.role,
        timestamp: new Date().toISOString(),
      });

      if (user) {
        // Use database ID if available, otherwise use the provider ID
        token.id = (user as any).dbId || user.id;
        token.role = (user as any).role;

        debugAuth('🎫 JWT TOKEN UPDATED', {
          tokenId: token.id,
          tokenRole: token.role,
          userDbId: (user as any).dbId,
          userId: user.id,
        });
      }
      return token;
    },
    async session({ session, token }) {
      debugAuth('📋 SESSION CALLBACK', {
        hasSession: !!session,
        hasUser: !!session.user,
        tokenId: token.id,
        tokenRole: token.role,
        sessionUserEmail: session.user?.email,
        timestamp: new Date().toISOString(),
      });

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;

        debugAuth('📋 SESSION UPDATED', {
          userId: session.user.id,
          userRole: session.user.role,
          userEmail: session.user.email,
        });
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      debugAuth('🎉 SIGNIN EVENT', {
        user: message.user.email,
        account: message.account?.provider,
        isNewUser: message.isNewUser,
        timestamp: new Date().toISOString(),
      });
    },
    async signOut(message) {
      debugAuth('👋 SIGNOUT EVENT', {
        session: !!message.session,
        token: !!message.token,
        timestamp: new Date().toISOString(),
      });
    },
    async createUser(message) {
      debugAuth('👤 CREATE USER EVENT', {
        user: message.user.email,
        timestamp: new Date().toISOString(),
      });
    },
    async session(message) {
      debugAuth('📋 SESSION EVENT', {
        hasSession: !!message.session,
        userEmail: message.session?.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
