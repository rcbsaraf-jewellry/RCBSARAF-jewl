import { NextResponse } from "next/server";
import { requireBillingSession } from "@/lib/billing/guard";
import { getBill } from "@/lib/billing/db";

export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireBillingSession();
  if (!session.ok) return session.response;
  const { id } = await context.params;
  const bill = await getBill(id);
  if (!bill) return NextResponse.json({ ok: false, error: "Bill not found." }, { status: 404 });
  return NextResponse.json({ ok: true, bill });
}
