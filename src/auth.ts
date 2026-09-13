import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";
import { resolveAuthRuntimeOptions } from "@/lib/auth-runtime";

export const authOptions = {
  ...resolveAuthRuntimeOptions(),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return new URL(url).origin === new URL(baseUrl).origin ? url : baseUrl;
    },
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        return authorizeCredentials(credentials, (email) => prisma.user.findUnique({ where: { email } }));
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
