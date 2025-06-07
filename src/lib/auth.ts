import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
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
          console.error('Auth error:', error);
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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        // Check if user exists in database
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!dbUser) {
            // Only allow Google sign-in for pre-registered admins
            return false; // Reject sign-in for unregistered users
          }

          // Check if user has admin privileges
          if (!['ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) {
            return false;
          }

          // Update user info from Google profile if needed
          if (user.name && (!dbUser.firstName || !dbUser.lastName)) {
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                firstName: dbUser.firstName || user.name?.split(' ')[0] || '',
                lastName:
                  dbUser.lastName ||
                  user.name?.split(' ').slice(1).join(' ') ||
                  '',
              },
            });
          }

          // Set the role and database ID on the user object
          (user as any).role = dbUser.role;
          (user as any).dbId = dbUser.id; // Store the database ID
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
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
