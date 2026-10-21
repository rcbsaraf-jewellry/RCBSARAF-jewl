import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBillingSession } from "@/lib/billing/guard";
import { listJewelryRates, upsertJewelryRates } from "@/lib/billing/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  rates: z.array(
    z.object({
      metalType: z.string().min(1),
      purity: z.string().min(1),
      ratePerGram: z.string().regex(/^\d+(\.\d{1,4})?$/),
    }),
  ),
});

export async function GET() {
  const session = await requireBillingSession();
  if (!session.ok) return session.response;
  const rates = await listJewelryRates();
  return NextResponse.json({ ok: true, rates });
}

export async function PUT(req: Request) {
  const session = await requireBillingSession();
  if (!session.ok) return session.response;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter valid metal rates." }, { status: 400 });
  }
  const rates = await upsertJewelryRates(parsed.data.rates);
  return NextResponse.json({ ok: true, rates });
}
