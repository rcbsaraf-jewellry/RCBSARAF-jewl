import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/catalog";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "sarafa-dev-secret-change-me-32b",
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role;
        token.organizationId = user.organizationId as string;
        token.contactId = user.contactId as string | null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = token.role as Role;
      session.user.organizationId = token.organizationId as string;
      session.user.contactId = token.contactId as string | null;
      return session;
    },
  },
} satisfies NextAuthConfig;
