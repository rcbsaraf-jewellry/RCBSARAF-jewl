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

function signPayload(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", pepper()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readPayload(token: string | null | undefined) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", pepper()).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
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
  const email = params.email.toLowerCase();
  const code = generateOtp();
  const codeHash = hashOtp(email, code);
  const exp = Date.now() + OTP_TTL_MS;
  try {
    const db = await getDb();
    await db
      .update(otpChallenges)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpChallenges.email, email), eq(otpChallenges.role, params.role), isNull(otpChallenges.consumedAt)));
    await db.insert(otpChallenges).values({
      id: nid(),
      email,
      role: params.role,
      codeHash,
      expiresAt: new Date(exp),
      requestIp: params.ip ?? null,
    });
  } catch {
    /* Vercel instances do not share PGlite; signed tickets still work. */
  }
  const ticket = signPayload({ t: "otp", email, role: params.role, codeHash, exp });
  return { code, ticket };
}

export async function consumeOtp(params: { email: string; role: AuthProfileId; code: string; ticket?: string }) {
  const email = params.email.toLowerCase();
  const codeHash = hashOtp(email, params.code);
  const now = Date.now();
  const ticket = readPayload(params.ticket);
  const ticketOk =
    ticket?.t === "otp" &&
    ticket.email === email &&
    ticket.role === params.role &&
    typeof ticket.exp === "number" &&
    ticket.exp > now &&
    typeof ticket.codeHash === "string" &&
    otpEquals(ticket.codeHash, codeHash);

  if (!ticketOk) {
    try {
      const db = await getDb();
      const row = (
        await db
          .select()
          .from(otpChallenges)
          .where(
            and(
              eq(otpChallenges.email, email),
              eq(otpChallenges.role, params.role),
              isNull(otpChallenges.consumedAt),
              gt(otpChallenges.expiresAt, new Date(now)),
            ),
          )
      )[0];
      if (!row) return { ok: false as const, error: "Invalid or expired code." };
      if (row.attempts >= MAX_ATTEMPTS) {
        await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, row.id));
        return { ok: false as const, error: "Too many attempts. Request a new code." };
      }
      if (!otpEquals(row.codeHash, codeHash)) {
        await db.update(otpChallenges).set({ attempts: row.attempts + 1 }).where(eq(otpChallenges.id, row.id));
        return { ok: false as const, error: "Invalid or expired code." };
      }
      await db.update(otpChallenges).set({ consumedAt: new Date() }).where(eq(otpChallenges.id, row.id));
    } catch {
      return { ok: false as const, error: "Invalid or expired code." };
    }
  }

  let user: typeof users.$inferSelect | undefined;
  try {
    const db = await getDb();
    user = (await db.select().from(users).where(eq(users.email, email)))[0];
  } catch {
    user = undefined;
  }
  if (!user || !user.isActive || user.role !== params.role) {
    return { ok: false as const, error: "Invalid or expired code." };
  }

  const grantId = signPayload({ t: "grant", userId: user.id, role: params.role, exp: now + GRANT_TTL_MS });
  try {
    const db = await getDb();
    await db.insert(authGrants).values({
      id: nid(),
      userId: user.id,
      role: params.role,
      expiresAt: new Date(now + GRANT_TTL_MS),
    });
  } catch {
    /* grant ticket is enough on Vercel */
  }
  return { ok: true as const, grantId, user };
}

export async function consumeGrant(grantId: string) {
  const signed = readPayload(grantId);
  if (signed?.t === "grant" && typeof signed.userId === "string" && typeof signed.exp === "number" && signed.exp > Date.now()) {
    const db = await getDb();
    const user = (await db.select().from(users).where(eq(users.id, signed.userId)))[0];
    if (!user || !user.isActive) return null;
    if (typeof signed.role === "string" && user.role !== signed.role) return null;
    return user;
  }

  const db = await getDb();
  const now = new Date();
  const grant = (await db.select().from(authGrants).where(eq(authGrants.id, grantId)))[0];
  if (!grant || grant.consumedAt || grant.expiresAt <= now) return null;
  await db.update(authGrants).set({ consumedAt: now }).where(eq(authGrants.id, grant.id));
  const user = (await db.select().from(users).where(eq(users.id, grant.userId)))[0];
  if (!user || !user.isActive) return null;
  return user;
}
