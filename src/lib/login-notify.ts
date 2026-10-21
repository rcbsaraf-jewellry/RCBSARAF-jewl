import { eq } from "drizzle-orm";
import { profileById } from "@/lib/auth-profiles";
import { getDb } from "@/lib/db/client";
import { loginFingerprints } from "@/lib/db/schema";
import { isSmtpConfigured, newDeviceEmailTemplate, sendMail } from "@/lib/smtp";

export async function notifyNewDevice(params: {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  fingerprint: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  if (!isSmtpConfigured()) return;
  const db = await getDb();
  const prev = (await db.select().from(loginFingerprints).where(eq(loginFingerprints.userId, params.userId)))[0];
  const isNew = !prev || prev.fingerprint !== params.fingerprint;
  if (prev) {
    await db
      .update(loginFingerprints)
      .set({ fingerprint: params.fingerprint, updatedAt: new Date() })
      .where(eq(loginFingerprints.userId, params.userId));
  } else {
    await db.insert(loginFingerprints).values({
      userId: params.userId,
      fingerprint: params.fingerprint,
    });
  }
  if (!isNew) return;
  const mail = newDeviceEmailTemplate({
    name: params.name,
    roleLabel: profileById(params.role)?.label ?? params.role,
    when: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ip: params.ip,
    userAgent: params.userAgent,
  });
  await sendMail({ to: params.email, ...mail });
}
