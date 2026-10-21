import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { Role } from "@/lib/catalog";

declare module "next-auth" {
  interface User {
    role: Role;
    organizationId: string;
    contactId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
      organizationId: string;
      contactId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    organizationId: string;
    contactId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const db = await getDb();
        const row = (await db.select().from(users).where(eq(users.email, email)))[0];
        if (!row || !row.isActive) return null;
        const ok = bcrypt.compareSync(password, row.passwordHash);
        if (!ok) return null;
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role as Role,
          organizationId: row.organizationId,
          contactId: row.contactId,
        };
      },
    }),
  ],
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
