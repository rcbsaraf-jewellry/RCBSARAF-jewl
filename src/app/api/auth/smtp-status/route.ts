import { NextResponse } from "next/server";
import { smtpUser, verifySmtp } from "@/lib/smtp";

export const runtime = "nodejs";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export async function GET() {
  const status = await verifySmtp();
  const inbox = smtpUser();
  return NextResponse.json({
    configured: status.configured,
    verified: status.verified,
    host: status.host,
    inbox: inbox ? maskEmail(inbox) : null,
    error: status.configured ? status.error : "SMTP credentials are not set.",
  });
}
