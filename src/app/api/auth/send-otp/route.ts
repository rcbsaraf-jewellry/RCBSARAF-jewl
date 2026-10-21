import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { AUTH_PROFILE_IDS, profileById } from "@/lib/auth-profiles";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { allowOtpSend, issueOtp } from "@/lib/otp";
import { requestMeta } from "@/lib/request-meta";
import { isSmtpConfigured, otpEmailTemplate, sendMail, smtpUser, verifySmtp } from "@/lib/smtp";

export const runtime = "nodejs";

const bodySchema = z.object({
  role: z.enum(AUTH_PROFILE_IDS),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Select a profile." }, { status: 400 });
  }

  if (!isSmtpConfigured()) {
    const status = await verifySmtp();
    return NextResponse.json(
      { ok: false, error: status.error ?? "Gmail SMTP is not configured.", smtp: status },
      { status: 503 },
    );
  }

  const { role } = parsed.data;
  const email = profileById(role)?.demoEmail;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Select a profile." }, { status: 400 });
  }
  const inbox = smtpUser();
  if (!inbox) {
    return NextResponse.json({ ok: false, error: "Set SMTP_USER in Vercel environment variables." }, { status: 503 });
  }

  const { ip } = await requestMeta();
  const throttle = allowOtpSend(`${email}:${role}:${ip}`);
  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: "Please wait before requesting another code.", retryAfter: throttle.retryAfter },
      { status: 429 },
    );
  }

  const db = await getDb();
  const user =
    (await db.select().from(users).where(and(eq(users.email, email), eq(users.role, role))))[0] ??
    (await db.select().from(users).where(eq(users.role, role)))[0];

  if (!user?.isActive) {
    return NextResponse.json({ ok: false, error: "This profile is not available yet." }, { status: 404 });
  }

  let issued: { code: string; ticket: string };
  try {
    issued = await issueOtp({ email, role, ip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create code.";
    console.error("[send-otp] OTP store failed:", message);
    return NextResponse.json(
      { ok: false, error: "Could not create a verification code. Retry in a moment." },
      { status: 500 },
    );
  }

  try {
    const mail = otpEmailTemplate({
      name: user.name,
      code: issued.code,
      roleLabel: profileById(role)?.label ?? role,
    });
    await sendMail({ to: inbox, ...mail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send email.";
    console.error("[send-otp] Gmail send failed:", message);
    return NextResponse.json(
      { ok: false, error: "Gmail could not send the code. Check Inbox and Spam, then resend." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "A verification code was sent to your Gmail inbox.",
    retryAfter: 60,
    ticket: issued.ticket,
  });
}
