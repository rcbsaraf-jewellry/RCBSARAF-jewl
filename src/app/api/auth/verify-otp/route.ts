import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_PROFILE_IDS, postLoginPath } from "@/lib/auth-profiles";
import { consumeOtp } from "@/lib/otp";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(AUTH_PROFILE_IDS),
  code: z.string().regex(/^\d{6}$/),
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
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const result = await consumeOtp(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    grant: result.grantId,
    redirectTo: postLoginPath(parsed.data.role),
  });
}
