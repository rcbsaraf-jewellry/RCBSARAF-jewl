import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authGrants, otpChallenges, users } from "@/lib/db/schema";
import { nid } from "@/lib/utils";
import type { AuthProfileId } from "@/lib/auth-profiles";

const OTP_TTL_MS = 10 * 60 * 1000;
const GRANT_TTL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 8;

const sendWindow = new Map<string, number[]>();

function pepper() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "sarafa-dev-secret-change-me-32b";
}

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(email: string, code: string) {
  return createHmac("sha256", pepper()).update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export function otpEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function allowOtpSend(key: string) {
  const now = Date.now();
  const stamps = (sendWindow.get(key) ?? []).filter((t) => now - t < HOUR_MS);
  const last = stamps[stamps.length - 1];
  if (last && now - last < RESEND_MS) {
    return { ok: false as const, retryAfter: Math.ceil((RESEND_MS - (now - last)) / 1000) };
  }
  if (stamps.length >= MAX_PER_HOUR) {
    return { ok: false as const, retryAfter: Math.ceil((HOUR_MS - (now - stamps[0])) / 1000) };
  }
  stamps.push(now);
  sendWindow.set(key, stamps);
  return { ok: true as const, retryAfter: 60 };
}

export async function issueOtp(params: { email: string; role: AuthProfileId; ip?: string | null }) {
  const db = await getDb();
  const email = params.email.toLowerCase();
  const code = generateOtp();
  await db
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpChallenges.email, email), eq(otpChallenges.role, params.role), isNull(otpChallenges.consumedAt)));
  await db.insert(otpChallenges).values({
    id: nid(),
    email,
    role: params.role,
    codeHash: hashOtp(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    requestIp: params.ip ?? null,
  });
  return code;
}

export async function consumeOtp(params: { email: string; role: AuthProfileId; code: string }) {
  const db = await getDb();
  const email = params.email.toLowerCase();
  const now = new Date();
  const row = (
    await db
      .select()
      .from(otpChallenges)
      .where(
        and(
          eq(otpChallenges.email, email),
          eq(otpChallenges.role, params.role),
          isNull(otpChallenges.consumedAt),
          gt(otpChallenges.expiresAt, now),
        ),
      )
  )[0];
  if (!row) return { ok: false as const, error: "Invalid or expired code." };

  if (row.attempts >= MAX_ATTEMPTS) {
    await db.update(otpChallenges).set({ consumedAt: now }).where(eq(otpChallenges.id, row.id));
    return { ok: false as const, error: "Too many attempts. Request a new code." };
  }

  const match = otpEquals(row.codeHash, hashOtp(email, params.code));
  if (!match) {
    await db.update(otpChallenges).set({ attempts: row.attempts + 1 }).where(eq(otpChallenges.id, row.id));
    return { ok: false as const, error: "Invalid or expired code." };
  }

  await db.update(otpChallenges).set({ consumedAt: now }).where(eq(otpChallenges.id, row.id));
  const user = (await db.select().from(users).where(eq(users.email, email)))[0];
  if (!user || !user.isActive || user.role !== params.role) {
    return { ok: false as const, error: "Invalid or expired code." };
  }

  const grantId = nid();
  await db.insert(authGrants).values({
    id: grantId,
    userId: user.id,
    role: params.role,
    expiresAt: new Date(Date.now() + GRANT_TTL_MS),
  });
  return { ok: true as const, grantId, user };
}

export async function consumeGrant(grantId: string) {
  const db = await getDb();
  const now = new Date();
  const grant = (await db.select().from(authGrants).where(eq(authGrants.id, grantId)))[0];
  if (!grant || grant.consumedAt || grant.expiresAt <= now) return null;
  await db.update(authGrants).set({ consumedAt: now }).where(eq(authGrants.id, grant.id));
  const user = (await db.select().from(users).where(eq(users.id, grant.userId)))[0];
  if (!user || !user.isActive) return null;
  return user;
}
