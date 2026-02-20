import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { connectDB } from './mongodb';
import { User } from '@/models';
import type { NextAuthConfig } from 'next-auth';
import type { DefaultSession } from 'next-auth';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user, account }: any) {
      if (!user.email) return false;

      try {
        await connectDB();

        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          dbUser = await User.create({
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            googleId: account?.providerAccountId || user.id || '',
            theme: 'dark',
          });
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
