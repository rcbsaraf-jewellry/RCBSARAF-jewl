import { numeric, pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 19, scale: 4 }).notNull().default("0");

export const jewelryRates = pgTable(
  "jewelry_rates",
  {
    id: text("id").primaryKey(),
    metalType: text("metal_type").notNull(),
    purity: text("purity").notNull(),
    ratePerGram: money("rate_per_gram"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("jewelry_rates_metal_purity_idx").on(t.metalType, t.purity)],
);

export const bills = pgTable("bills", {
  id: text("id").primaryKey(),
  billNumber: text("bill_number").notNull(),
  modelType: text("model_type").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  gstMode: text("gst_mode").notNull().default("intra"),
  grossAmount: money("gross_amount"),
  makingChargesTotal: money("making_charges_total"),
  stoneChargesTotal: money("stone_charges_total"),
  taxableAmount: money("taxable_amount"),
  gstTotal: money("gst_total"),
  cgst: money("cgst"),
  sgst: money("sgst"),
  igst: money("igst"),
  advanceAmount: money("advance_amount"),
  finalAmount: money("final_amount"),
  cashReceived: money("cash_received"),
  changeDue: money("change_due"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billItems = pgTable(
  "bill_items",
  {
    id: text("id").primaryKey(),
    billId: text("bill_id")
      .notNull()
      .references(() => bills.id),
    itemName: text("item_name").notNull(),
    huid: text("huid"),
    purity: text("purity").notNull(),
    metalType: text("metal_type").notNull(),
    grossWeight: money("gross_weight"),
    stoneWeight: money("stone_weight"),
    netWeight: money("net_weight"),
    ratePerGram: money("rate_per_gram"),
    makingCharge: money("making_charge"),
    stoneCharge: money("stone_charge"),
    diamondCarats: money("diamond_carats"),
    lineTotal: money("line_total"),
  },
  (t) => [index("bill_items_bill_idx").on(t.billId)],
);

export const billPayments = pgTable(
  "bill_payments",
  {
    id: text("id").primaryKey(),
    billId: text("bill_id")
      .notNull()
      .references(() => bills.id),
    paymentMode: text("payment_mode").notNull(),
    amount: money("amount"),
    transactionRef: text("transaction_ref"),
  },
  (t) => [index("bill_payments_bill_idx").on(t.billId)],
);
