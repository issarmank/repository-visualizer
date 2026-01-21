import NextAuth, { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Augment NextAuth types so accessToken is known everywhere
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo admin:org",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }): Promise<JWT> {
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }): Promise<Session> {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };