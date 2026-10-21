import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireBillingSession() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (session.user.role !== "billing") {
    return { ok: false as const, response: NextResponse.json({ error: "Billing workspace only." }, { status: 403 }) };
  }
  return { ok: true as const, user: session.user };
}
