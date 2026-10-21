import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBillingSession } from "@/lib/billing/guard";
import { createBill, listRecentBills } from "@/lib/billing/db";
import { BILL_MODELS, GST_MODES, MAKING_METHODS, PAYMENT_MODES } from "@/lib/billing/types";

export const runtime = "nodejs";

const lineSchema = z.object({
  id: z.string(),
  itemName: z.string(),
  huid: z.string(),
  metalType: z.string(),
  purity: z.string(),
  grossWeight: z.string(),
  stoneWeight: z.string(),
  makingMethod: z.enum(MAKING_METHODS),
  makingRate: z.string(),
  stoneCharge: z.string(),
  certificationFee: z.string(),
  diamondCarats: z.string(),
});

const tenderSchema = z.object({
  id: z.string(),
  paymentMode: z.enum(PAYMENT_MODES),
  amount: z.string(),
  transactionRef: z.string(),
});

const bodySchema = z.object({
  modelType: z.enum(BILL_MODELS),
  customerName: z.string().trim().min(1),
  customerPhone: z.string().optional(),
  gstMode: z.enum(GST_MODES),
  advanceAmount: z.string().default("0"),
  cashReceived: z.string().default("0"),
  items: z.array(lineSchema).min(1),
  tenders: z.array(tenderSchema).default([]),
});

export async function GET() {
  const session = await requireBillingSession();
  if (!session.ok) return session.response;
  const bills = await listRecentBills();
  return NextResponse.json({ ok: true, bills });
}

export async function POST(req: Request) {
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
    return NextResponse.json({ ok: false, error: "Complete customer and jewellery lines before saving." }, { status: 400 });
  }
  if (parsed.data.modelType === "CASH_ONLY" && parsed.data.tenders.some((t) => t.paymentMode !== "CASH")) {
    return NextResponse.json({ ok: false, error: "Cash-only bills cannot accept card, UPI, or cheque." }, { status: 400 });
  }
  try {
    const saved = await createBill(parsed.data);
    return NextResponse.json({ ok: true, bill: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save bill.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
