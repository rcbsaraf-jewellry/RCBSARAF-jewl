import { and, eq } from "drizzle-orm";
import { add, documentTotals, eq as moneyEq, gt, isZero, m, money, sub } from "@/lib/money";
import { ACCOUNT_CODES, accId, POSTING_TYPES, TYPE_META, type DocumentType } from "@/lib/catalog";
import type { Database } from "@/lib/db/client";
import {
  inventoryMovements,
  items,
  journalLines,
  journals,
  numberSeries,
  paymentAllocations,
  payments,
  transactionLines,
  transactions,
  accounts,
} from "@/lib/db/schema";
import { nid } from "@/lib/utils";

export type JournalLineInput = {
  accountId: string;
  debit?: string | number;
  credit?: string | number;
  description?: string;
  contactId?: string | null;
};

export async function nextDocNumber(db: Database, orgId: string, documentType: string) {
  const rows = await db
    .select()
    .from(numberSeries)
    .where(and(eq(numberSeries.organizationId, orgId), eq(numberSeries.documentType, documentType)));
  const series = rows[0];
  if (!series) {
    const prefix = (TYPE_META[documentType as DocumentType]?.prefix ?? documentType.slice(0, 3)).toUpperCase();
    const number = `${prefix}-0001`;
    await db.insert(numberSeries).values({
      id: nid(),
      organizationId: orgId,
      documentType,
      prefix: `${prefix}-`,
      nextNumber: 2,
      padding: 4,
    });
    return number;
  }
  const number = `${series.prefix}${String(series.nextNumber).padStart(series.padding, "0")}`;
  await db
    .update(numberSeries)
    .set({ nextNumber: series.nextNumber + 1 })
    .where(eq(numberSeries.id, series.id));
  return number;
}

export async function postJournal(
  db: Database,
  input: {
    organizationId: string;
    date: string;
    notes?: string;
    sourceType: string;
    sourceId?: string;
    lines: JournalLineInput[];
  },
) {
  const cleaned = input.lines
    .map((line) => ({
      accountId: line.accountId,
      debit: money(line.debit),
      credit: money(line.credit),
      description: line.description,
      contactId: line.contactId ?? null,
    }))
    .filter((line) => !isZero(line.debit) || !isZero(line.credit));

  const debit = cleaned.reduce((s, l) => s.plus(m(l.debit)), m(0));
  const credit = cleaned.reduce((s, l) => s.plus(m(l.credit)), m(0));
  if (!debit.eq(credit)) {
    throw new Error(`Unbalanced journal: DR ${debit.toFixed(2)} CR ${credit.toFixed(2)}`);
  }
  if (cleaned.length < 2) return null;

  const number = await nextDocNumber(db, input.organizationId, "journal");
  const id = nid();
  await db.insert(journals).values({
    id,
    organizationId: input.organizationId,
    number,
    date: input.date,
    notes: input.notes,
    status: "published",
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });
  await db.insert(journalLines).values(
    cleaned.map((line, i) => ({
      id: nid(),
      journalId: id,
      lineNo: i + 1,
      accountId: line.accountId,
      contactId: line.contactId,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    })),
  );
  return id;
}

async function accountByCode(db: Database, orgId: string, code: string) {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.organizationId, orgId), eq(accounts.code, code)));
  return rows[0] ?? null;
}

export type TxLineInput = {
  itemId?: string | null;
  description?: string;
  accountId?: string | null;
  quantity: string | number;
  rate: string | number;
  discountPct?: string | number;
  taxId?: string | null;
  taxPct?: string | number;
  projectId?: string | null;
};

export type SaveTransactionInput = {
  id?: string;
  organizationId: string;
  documentType: DocumentType;
  number?: string;
  reference?: string;
  status: string;
  contactId?: string | null;
  date: string;
  dueDate?: string | null;
  paymentTermId?: string | null;
  salesperson?: string | null;
  subject?: string | null;
  notes?: string | null;
  terms?: string | null;
  currency?: string;
  shipping?: string | number;
  adjustment?: string | number;
  projectId?: string | null;
  expenseAccountId?: string | null;
  paidThroughAccountId?: string | null;
  depositAccountId?: string | null;
  recurrence?: string | null;
  createdBy?: string | null;
  lines: TxLineInput[];
};

function shouldPost(type: DocumentType, status: string) {
  if (!POSTING_TYPES.includes(type)) return false;
  return !["draft", "void", "stopped"].includes(status);
}

function invoiceOpenStatus(balance: string, total: string, dueDate?: string | null) {
  if (isZero(balance)) return "paid";
  if (gt(total, balance) && gt(balance, 0)) return "partially_paid";
  if (dueDate && dueDate < new Date().toISOString().slice(0, 10)) return "overdue";
  return "sent";
}

export async function saveTransaction(db: Database, input: SaveTransactionInput) {
  const meta = TYPE_META[input.documentType];
  const totals = documentTotals({
    lines: input.lines,
    shipping: input.shipping,
    adjustment: input.adjustment,
  });
  const id = input.id ?? nid();
  const number = input.number ?? (await nextDocNumber(db, input.organizationId, input.documentType));
  const existing = input.id
    ? (await db.select().from(transactions).where(eq(transactions.id, input.id)))[0]
    : null;

  if (existing?.journalId) {
    await db.delete(journalLines).where(eq(journalLines.journalId, existing.journalId));
    await db.delete(journals).where(eq(journals.id, existing.journalId));
  }

  const status =
    input.documentType === "invoice" && shouldPost(input.documentType, input.status)
      ? invoiceOpenStatus(totals.total, totals.total, input.dueDate)
      : input.status;

  const row = {
    id,
    organizationId: input.organizationId,
    documentType: input.documentType,
    number,
    reference: input.reference,
    status,
    contactId: input.contactId,
    date: input.date,
    dueDate: input.dueDate,
    paymentTermId: input.paymentTermId,
    salesperson: input.salesperson,
    subject: input.subject,
    notes: input.notes,
    terms: input.terms,
    currency: input.currency ?? "INR",
    exchangeRate: "1",
    subTotal: totals.subTotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    shipping: totals.shipping,
    adjustment: totals.adjustment,
    total: totals.total,
    balance: shouldPost(input.documentType, status) ? totals.total : "0",
    paid: "0",
    sourceId: existing?.sourceId,
    projectId: input.projectId,
    depositAccountId: input.depositAccountId,
    expenseAccountId: input.expenseAccountId,
    paidThroughAccountId: input.paidThroughAccountId,
    recurrence: input.recurrence,
    createdBy: input.createdBy,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(transactions).set(row).where(eq(transactions.id, id));
    await db.delete(transactionLines).where(eq(transactionLines.transactionId, id));
  } else {
    await db.insert(transactions).values(row);
  }

  if (input.lines.length) {
    await db.insert(transactionLines).values(
      input.lines.map((line, i) => {
        const qty = m(line.quantity);
        const rate = m(line.rate);
        const gross = qty.times(rate);
        const disc = gross.times(m(line.discountPct)).div(100);
        const taxable = gross.minus(disc);
        const tax = taxable.times(m(line.taxPct)).div(100);
        return {
          id: nid(),
          transactionId: id,
          lineNo: i + 1,
          itemId: line.itemId,
          description: line.description,
          accountId: line.accountId,
          quantity: money(line.quantity),
          rate: money(line.rate),
          discountPct: money(line.discountPct),
          taxId: line.taxId,
          taxPct: money(line.taxPct),
          taxable: taxable.toFixed(2),
          taxAmount: tax.toFixed(2),
          amount: taxable.plus(tax).toFixed(2),
          projectId: line.projectId,
        };
      }),
    );
  }

  let journalId: string | null = null;
  if (shouldPost(input.documentType, status)) {
    journalId = await postDocumentJournal(db, {
      ...input,
      id,
      number,
      totals,
    });
    if (journalId) {
      await db.update(transactions).set({ journalId }).where(eq(transactions.id, id));
    }
    await applyInventory(db, input, id, meta.inventoryDir);
  }

  return { id, number, totals, status, journalId };
}

async function postDocumentJournal(
  db: Database,
  input: SaveTransactionInput & {
    id: string;
    number: string;
    totals: ReturnType<typeof documentTotals>;
  },
) {
  const orgId = input.organizationId;
  const ar = accId(ACCOUNT_CODES.ar);
  const ap = accId(ACCOUNT_CODES.ap);
  const sales = accId(ACCOUNT_CODES.sales);
  const outputGst = accId(ACCOUNT_CODES.outputGst);
  const inputGst = accId(ACCOUNT_CODES.inputGst);
  const cogs = accId(ACCOUNT_CODES.cogs);
  const inventory = accId(ACCOUNT_CODES.inventory);
  const bank = input.paidThroughAccountId ?? accId(ACCOUNT_CODES.bank);
  const expense = input.expenseAccountId ?? accId(ACCOUNT_CODES.misc);
  const net = sub(input.totals.subTotal, input.totals.discountTotal);

  const lines: JournalLineInput[] = [];
  const type = input.documentType;
  const desc = `${TYPE_META[type].label} ${input.number}`;

  if (type === "invoice" || type === "retainer_invoice") {
    lines.push({ accountId: ar, debit: input.totals.total, description: desc, contactId: input.contactId });
    lines.push({ accountId: sales, credit: net, description: desc });
    if (!isZero(input.totals.taxTotal)) {
      lines.push({ accountId: outputGst, credit: input.totals.taxTotal, description: "Output GST" });
    }
    if (!isZero(input.totals.shipping)) {
      lines.push({ accountId: accId(ACCOUNT_CODES.otherIncome), credit: input.totals.shipping, description: "Shipping" });
    }
    if (!isZero(input.totals.adjustment)) {
      const adj = m(input.totals.adjustment);
      if (adj.gt(0)) lines.push({ accountId: accId(ACCOUNT_CODES.otherIncome), credit: adj.toFixed(2), description: "Adjustment" });
      else lines.push({ accountId: accId(ACCOUNT_CODES.misc), debit: adj.abs().toFixed(2), description: "Adjustment" });
    }
    const cogsAmount = await goodsCost(db, input.lines);
    if (!isZero(cogsAmount)) {
      lines.push({ accountId: cogs, debit: cogsAmount, description: "COGS" });
      lines.push({ accountId: inventory, credit: cogsAmount, description: "Inventory" });
    }
  } else if (type === "credit_note") {
    lines.push({ accountId: ar, credit: input.totals.total, description: desc, contactId: input.contactId });
    lines.push({ accountId: sales, debit: net, description: desc });
    if (!isZero(input.totals.taxTotal)) {
      lines.push({ accountId: outputGst, debit: input.totals.taxTotal, description: "Output GST reversal" });
    }
  } else if (type === "bill") {
    lines.push({ accountId: ap, credit: input.totals.total, description: desc, contactId: input.contactId });
    const purchaseAcct = input.lines[0]?.accountId || accId(ACCOUNT_CODES.purchases);
    const hasInventory = await linesHaveInventory(db, input.lines);
    lines.push({
      accountId: hasInventory ? inventory : purchaseAcct,
      debit: net,
      description: desc,
    });
    if (!isZero(input.totals.taxTotal)) {
      lines.push({ accountId: inputGst, debit: input.totals.taxTotal, description: "Input GST" });
    }
  } else if (type === "vendor_credit") {
    lines.push({ accountId: ap, debit: input.totals.total, description: desc, contactId: input.contactId });
    lines.push({ accountId: accId(ACCOUNT_CODES.purchases), credit: net, description: desc });
    if (!isZero(input.totals.taxTotal)) {
      lines.push({ accountId: inputGst, credit: input.totals.taxTotal, description: "Input GST reversal" });
    }
  } else if (type === "expense" || type === "mileage") {
    lines.push({ accountId: expense, debit: net, description: desc });
    if (!isZero(input.totals.taxTotal)) {
      lines.push({ accountId: inputGst, debit: input.totals.taxTotal, description: "Input GST" });
    }
    lines.push({ accountId: bank, credit: input.totals.total, description: desc });
  }

  return postJournal(db, {
    organizationId: orgId,
    date: input.date,
    notes: desc,
    sourceType: type,
    sourceId: input.id,
    lines,
  });
}

async function linesHaveInventory(db: Database, lines: TxLineInput[]) {
  for (const line of lines) {
    if (!line.itemId) continue;
    const item = (await db.select().from(items).where(eq(items.id, line.itemId)))[0];
    if (item?.trackInventory) return true;
  }
  return false;
}

async function goodsCost(db: Database, lines: TxLineInput[]) {
  let cost = m(0);
  for (const line of lines) {
    if (!line.itemId) continue;
    const item = (await db.select().from(items).where(eq(items.id, line.itemId)))[0];
    if (item?.trackInventory) {
      cost = cost.plus(m(item.purchaseRate).times(m(line.quantity)));
    }
  }
  return cost.toFixed(2);
}

async function applyInventory(db: Database, input: SaveTransactionInput, sourceId: string, dir: 0 | 1 | -1) {
  if (dir === 0) return;
  for (const line of input.lines) {
    if (!line.itemId) continue;
    const item = (await db.select().from(items).where(eq(items.id, line.itemId)))[0];
    if (!item?.trackInventory) continue;
    const qty = m(line.quantity).times(dir);
    const next = m(item.stockOnHand).plus(qty);
    await db.update(items).set({ stockOnHand: next.toFixed(4) }).where(eq(items.id, item.id));
    await db.insert(inventoryMovements).values({
      id: nid(),
      organizationId: input.organizationId,
      itemId: item.id,
      date: input.date,
      reason: input.documentType,
      quantity: qty.toFixed(4),
      unitCost: item.purchaseRate,
      sourceType: input.documentType,
      sourceId,
    });
  }
}

export async function recordPayment(
  db: Database,
  input: {
    organizationId: string;
    paymentType: "received" | "made";
    contactId: string;
    date: string;
    amount: string | number;
    method?: string;
    accountId?: string;
    reference?: string;
    notes?: string;
    allocations: { transactionId: string; amount: string | number }[];
  },
) {
  const amount = money(input.amount);
  const allocated = input.allocations.reduce((s, a) => add(s, a.amount), "0");
  const unused = sub(amount, allocated);
  const number = await nextDocNumber(db, input.organizationId, input.paymentType === "received" ? "payment_received" : "payment_made");
  const id = nid();
  const bank = input.accountId ?? accId(ACCOUNT_CODES.bank);
  const contra = input.paymentType === "received" ? accId(ACCOUNT_CODES.ar) : accId(ACCOUNT_CODES.ap);

  const journalId = await postJournal(db, {
    organizationId: input.organizationId,
    date: input.date,
    notes: `Payment ${number}`,
    sourceType: input.paymentType === "received" ? "payment_received" : "payment_made",
    sourceId: id,
    lines:
      input.paymentType === "received"
        ? [
            { accountId: bank, debit: amount, description: `Payment ${number}` },
            { accountId: contra, credit: amount, description: `Payment ${number}`, contactId: input.contactId },
          ]
        : [
            { accountId: contra, debit: amount, description: `Payment ${number}`, contactId: input.contactId },
            { accountId: bank, credit: amount, description: `Payment ${number}` },
          ],
  });

  await db.insert(payments).values({
    id,
    organizationId: input.organizationId,
    paymentType: input.paymentType,
    number,
    contactId: input.contactId,
    date: input.date,
    amount,
    unused,
    method: input.method ?? "bank_transfer",
    accountId: bank,
    reference: input.reference,
    notes: input.notes,
    journalId,
  });

  for (const alloc of input.allocations) {
    if (isZero(alloc.amount)) continue;
    await db.insert(paymentAllocations).values({
      id: nid(),
      paymentId: id,
      transactionId: alloc.transactionId,
      amount: money(alloc.amount),
    });
    const txn = (await db.select().from(transactions).where(eq(transactions.id, alloc.transactionId)))[0];
    if (!txn) continue;
    const paid = add(txn.paid, alloc.amount);
    const balance = sub(txn.total, paid);
    const status = moneyEq(balance, 0)
      ? "paid"
      : gt(paid, 0)
        ? "partially_paid"
        : txn.dueDate && txn.dueDate < new Date().toISOString().slice(0, 10)
          ? "overdue"
          : txn.status;
    await db
      .update(transactions)
      .set({ paid, balance, status, updatedAt: new Date() })
      .where(eq(transactions.id, txn.id));
  }

  return { id, number, journalId };
}

export async function accountBalances(db: Database, orgId: string, asOf?: string) {
  const acctRows = await db.select().from(accounts).where(eq(accounts.organizationId, orgId));
  const lineRows = await db
    .select({
      accountId: journalLines.accountId,
      debit: journalLines.debit,
      credit: journalLines.credit,
      date: journals.date,
    })
    .from(journalLines)
    .innerJoin(journals, eq(journals.id, journalLines.journalId));
  return acctRows
    .map((row) => {
      const related = lineRows.filter((l) => l.accountId === row.id && (!asOf || l.date <= asOf));
      const debit = related.reduce((s, l) => s.plus(m(l.debit)), m(0));
      const credit = related.reduce((s, l) => s.plus(m(l.credit)), m(0));
      const natural = ["asset", "expense"].includes(row.category) ? debit.minus(credit) : credit.minus(debit);
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        accountType: row.accountType,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
        balance: natural.toFixed(2),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function lookupAccountId(db: Database, orgId: string, code: string) {
  const row = await accountByCode(db, orgId, code);
  return row?.id ?? accId(code);
}
