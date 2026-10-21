import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { nid } from "@/lib/utils";
import { calculateBillSummary, calculateJewelryLineItem } from "@/lib/billing/calculator";
import { billItems, billPayments, bills, jewelryRates } from "@/lib/billing/schema";
import { BILLING_SCHEMA_SQL } from "@/lib/billing/sql";
import { METAL_KEYS, type BillModel, type GstMode, type LineDraft, type TenderLine } from "@/lib/billing/types";

const DEFAULT_RATES: Record<string, string> = {
  "GOLD:24K": "7800.00",
  "GOLD:22K": "7150.00",
  "GOLD:18K": "5850.00",
  "GOLD:14K": "4550.00",
  "SILVER:999": "98.00",
  "PLATINUM:950": "3400.00",
};

const globalForBilling = globalThis as unknown as { sarafaBillingReady?: Promise<void> };

async function runStatements() {
  const db = await getDb();
  const statements = BILLING_SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
  for (const metal of METAL_KEYS) {
    const existing = await db
      .select({ id: jewelryRates.id })
      .from(jewelryRates)
      .where(and(eq(jewelryRates.metalType, metal.metalType), eq(jewelryRates.purity, metal.purity)))
      .limit(1);
    if (existing.length) continue;
    await db.insert(jewelryRates).values({
      id: nid(),
      metalType: metal.metalType,
      purity: metal.purity,
      ratePerGram: DEFAULT_RATES[`${metal.metalType}:${metal.purity}`] ?? "0",
    });
  }
}

export async function ensureBillingSchema() {
  if (!globalForBilling.sarafaBillingReady) {
    globalForBilling.sarafaBillingReady = runStatements().catch((error) => {
      globalForBilling.sarafaBillingReady = undefined;
      throw error;
    });
  }
  await globalForBilling.sarafaBillingReady;
}

export async function listJewelryRates() {
  await ensureBillingSchema();
  const db = await getDb();
  const rows = await db.select().from(jewelryRates);
  return rows.map((row) => ({
    id: row.id,
    metalType: row.metalType,
    purity: row.purity,
    ratePerGram: String(row.ratePerGram),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }));
}

export async function upsertJewelryRates(rows: Array<{ metalType: string; purity: string; ratePerGram: string }>) {
  await ensureBillingSchema();
  const db = await getDb();
  const now = new Date();
  for (const row of rows) {
    const existing = (
      await db
        .select()
        .from(jewelryRates)
        .where(and(eq(jewelryRates.metalType, row.metalType), eq(jewelryRates.purity, row.purity)))
        .limit(1)
    )[0];
    if (existing) {
      await db
        .update(jewelryRates)
        .set({ ratePerGram: row.ratePerGram, updatedAt: now })
        .where(eq(jewelryRates.id, existing.id));
    } else {
      await db.insert(jewelryRates).values({
        id: nid(),
        metalType: row.metalType,
        purity: row.purity,
        ratePerGram: row.ratePerGram,
        updatedAt: now,
      });
    }
  }
  return listJewelryRates();
}

function rateMap(rates: Awaited<ReturnType<typeof listJewelryRates>>) {
  const map = new Map<string, string>();
  for (const rate of rates) {
    map.set(`${rate.metalType}:${rate.purity}`, rate.ratePerGram);
  }
  return map;
}

async function nextBillNumber() {
  const db = await getDb();
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `JB-${stamp}-`;
  const latest = await db.select({ billNumber: bills.billNumber }).from(bills).orderBy(desc(bills.createdAt)).limit(20);
  const today = latest
    .map((row) => row.billNumber)
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (today.length ? Math.max(...today) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createBill(input: {
  modelType: BillModel;
  customerName: string;
  customerPhone?: string;
  gstMode: GstMode;
  advanceAmount: string;
  cashReceived: string;
  items: LineDraft[];
  tenders: TenderLine[];
}) {
  await ensureBillingSchema();
  const db = await getDb();
  const rates = rateMap(await listJewelryRates());
  const computed = input.items.map((item) => {
    const ratePerGram = rates.get(`${item.metalType}:${item.purity}`) ?? "0";
    const line = calculateJewelryLineItem({
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      ratePerGram,
      makingMethod: item.makingMethod,
      makingRate: item.makingRate,
      stoneCharge: item.stoneCharge,
      certificationFee: item.certificationFee,
    });
    return { item, ratePerGram, line };
  });
  const summary = calculateBillSummary({
    lines: computed.map((row) => row.line),
    gstMode: input.gstMode,
    advanceAmount: input.advanceAmount,
    tenders: input.tenders,
    cashReceived: input.cashReceived,
    model: input.modelType,
  });
  if (!computed.length) throw new Error("Add at least one jewellery item.");
  if (!summary.tenderValid) throw new Error(summary.tenderError ?? "Tender is incomplete.");

  const id = nid();
  const billNumber = await nextBillNumber();
  await db.insert(bills).values({
    id,
    billNumber,
    modelType: input.modelType,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone?.trim() || null,
    gstMode: input.gstMode,
    grossAmount: summary.grossAmount,
    makingChargesTotal: summary.makingChargesTotal,
    stoneChargesTotal: summary.stoneChargesTotal,
    taxableAmount: summary.taxableAmount,
    gstTotal: summary.gstTotal,
    cgst: summary.cgst,
    sgst: summary.sgst,
    igst: summary.igst,
    advanceAmount: summary.advanceAmount,
    finalAmount: summary.finalAmount,
    cashReceived: input.modelType === "CASH_ONLY" ? summary.tenderedAmount : "0",
    changeDue: summary.changeDue,
    paymentStatus: "paid",
  });
  for (const row of computed) {
    await db.insert(billItems).values({
      id: nid(),
      billId: id,
      itemName: row.item.itemName.trim() || "Jewellery item",
      huid: row.item.huid.trim() || null,
      purity: row.item.purity,
      metalType: row.item.metalType,
      grossWeight: row.item.grossWeight || "0",
      stoneWeight: row.item.stoneWeight || "0",
      netWeight: row.line.netWeight,
      ratePerGram: row.line.ratePerGram,
      makingCharge: row.line.makingCharge,
      stoneCharge: row.line.stoneCharge,
      diamondCarats: row.item.diamondCarats || "0",
      lineTotal: row.line.lineTotal,
    });
  }
  const tenders =
    input.modelType === "CASH_ONLY"
      ? [{ id: nid(), paymentMode: "CASH" as const, amount: summary.tenderedAmount, transactionRef: "" }]
      : input.tenders.filter((t) => Number(t.amount) > 0);
  for (const tender of tenders) {
    await db.insert(billPayments).values({
      id: nid(),
      billId: id,
      paymentMode: tender.paymentMode,
      amount: tender.amount,
      transactionRef: tender.transactionRef.trim() || null,
    });
  }
  return getBill(id);
}

export async function getBill(id: string) {
  await ensureBillingSchema();
  const db = await getDb();
  const bill = (await db.select().from(bills).where(eq(bills.id, id)))[0];
  if (!bill) return null;
  const items = await db.select().from(billItems).where(eq(billItems.billId, id));
  const payments = await db.select().from(billPayments).where(eq(billPayments.billId, id));
  return { bill, items, payments };
}

export async function listRecentBills(limit = 12) {
  await ensureBillingSchema();
  const db = await getDb();
  return db.select().from(bills).orderBy(desc(bills.createdAt)).limit(limit);
}
