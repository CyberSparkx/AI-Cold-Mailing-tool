import "server-only";
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || "dev_client_id",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "dev_client_secret",
      authorization: {
        params: {
          // Minimal scopes for login identity only; NO Gmail or Sheets scopes here!
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert User in MongoDB
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              settings: {
                defaultDailyLimit: 25,
                sendWindowStart: 9,
                sendWindowEnd: 17,
                portfolioUrl: "https://narenroy.in/",
              },
            },
          });

          if (account) {
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error in NextAuth signIn callback:", err);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, email: true, name: true, image: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        } catch {
          // In offline / mock dev mode fallback to sub or email
          token.id = token.sub || user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
