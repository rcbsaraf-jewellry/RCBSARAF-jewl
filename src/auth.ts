import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { isAuthProfile } from "@/lib/auth-profiles";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { notifyNewDevice } from "@/lib/login-notify";
import { consumeGrant } from "@/lib/otp";
import { requestMeta } from "@/lib/request-meta";
import type { Role } from "@/lib/catalog";
import "@auth/core/jwt";

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

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    organizationId: string;
    contactId?: string | null;
  }
}

function toUser(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    organizationId: row.organizationId,
    contactId: row.contactId,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        const role = String(credentials?.role ?? "");
        if (!email || !password) return null;
        const db = await getDb();
        const row = (await db.select().from(users).where(eq(users.email, email)))[0];
        if (!row || !row.isActive) return null;
        const ok = bcrypt.compareSync(password, row.passwordHash);
        if (!ok) return null;
        if (isAuthProfile(role) && row.role !== role) return null;
        try {
          const meta = await requestMeta();
          void notifyNewDevice({
            userId: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            fingerprint: meta.fingerprint,
            ip: meta.ip,
            userAgent: meta.userAgent,
          }).catch(() => undefined);
        } catch {
          /* login still succeeds if device notify cannot run */
        }
        return toUser(row);
      },
    }),
    Credentials({
      id: "otp-grant",
      credentials: {
        grant: { label: "Grant", type: "text" },
      },
      async authorize(credentials) {
        const grant = String(credentials?.grant ?? "");
        if (!grant) return null;
        const row = await consumeGrant(grant);
        if (!row) return null;
        return toUser(row);
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
