"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth, requireSession, signIn, signOut } from "@/auth";
import { postJournal, recordPayment, saveTransaction } from "@/lib/accounting/engine";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { getDb } from "@/lib/db/client";
import { accounts, bankTransactions, contacts, items, projects, timesheets } from "@/lib/db/schema";
import { nid } from "@/lib/utils";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/home");
  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    redirect("/login?error=1");
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

const lineSchema = z.object({
  itemId: z.string().optional().nullable(),
  description: z.string().optional(),
  accountId: z.string().optional().nullable(),
  quantity: z.string().default("1"),
  rate: z.string().default("0"),
  discountPct: z.string().default("0"),
  taxId: z.string().optional().nullable(),
  taxPct: z.string().default("0"),
});

export async function saveDocumentAction(formData: FormData) {
  const user = await requireSession();
  const documentType = String(formData.get("documentType")) as DocumentType;
  const status = String(formData.get("intent") === "draft" ? "draft" : formData.get("status") || "sent");
  const rawLines = String(formData.get("linesJson") ?? "[]");
  const lines = z.array(lineSchema).parse(JSON.parse(rawLines));
  const result = await saveTransaction(await getDb(), {
    id: String(formData.get("id") || "") || undefined,
    organizationId: user.organizationId,
    documentType,
    number: String(formData.get("number") || "") || undefined,
    reference: String(formData.get("reference") || "") || undefined,
    status,
    contactId: String(formData.get("contactId") || "") || null,
    date: String(formData.get("date")),
    dueDate: String(formData.get("dueDate") || "") || null,
    salesperson: String(formData.get("salesperson") || "") || null,
    subject: String(formData.get("subject") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    terms: String(formData.get("terms") || "") || null,
    shipping: String(formData.get("shipping") || "0"),
    adjustment: String(formData.get("adjustment") || "0"),
    expenseAccountId: String(formData.get("expenseAccountId") || "") || null,
    paidThroughAccountId: String(formData.get("paidThroughAccountId") || "") || null,
    recurrence: String(formData.get("recurrence") || "") || null,
    createdBy: user.id,
    lines,
  });
  const group = TYPE_META[documentType].group;
  const slug = documentType.replaceAll("_", "-");
  revalidatePath(`/${group}/${slug}s`);
  redirect(`/${group}/${slug === "invoice" ? "invoices" : slug + (slug.endsWith("s") ? "" : "s")}/${result.id}`);
}

function typePath(type: DocumentType) {
  const meta = TYPE_META[type];
  const map: Record<string, string> = {
    quote: "/sales/quotes",
    sales_order: "/sales/sales-orders",
    delivery_challan: "/sales/delivery-challans",
    invoice: "/sales/invoices",
    recurring_invoice: "/sales/recurring-invoices",
    retainer_invoice: "/sales/retainer-invoices",
    credit_note: "/sales/credit-notes",
    purchase_order: "/purchases/purchase-orders",
    bill: "/purchases/bills",
    recurring_bill: "/purchases/recurring-bills",
    vendor_credit: "/purchases/vendor-credits",
    expense: "/purchases/expenses",
    mileage: "/purchases/mileage",
  };
  return map[type] ?? `/${meta.group}`;
}

export async function saveDocument(formData: FormData) {
  const user = await requireSession();
  const documentType = String(formData.get("documentType")) as DocumentType;
  const intent = String(formData.get("intent") ?? "send");
  const statusMap: Record<string, string> = {
    draft: "draft",
    send: documentType === "quote" ? "sent" : documentType === "sales_order" ? "confirmed" : documentType === "purchase_order" ? "issued" : "sent",
  };
  const rawLines = String(formData.get("linesJson") ?? "[]");
  const lines = z.array(lineSchema).parse(JSON.parse(rawLines));
  const result = await saveTransaction(await getDb(), {
    id: String(formData.get("id") || "") || undefined,
    organizationId: user.organizationId,
    documentType,
    reference: String(formData.get("reference") || "") || undefined,
    status: statusMap[intent] ?? "sent",
    contactId: String(formData.get("contactId") || "") || null,
    date: String(formData.get("date")),
    dueDate: String(formData.get("dueDate") || "") || null,
    salesperson: String(formData.get("salesperson") || "") || null,
    subject: String(formData.get("subject") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    terms: String(formData.get("terms") || "") || null,
    shipping: String(formData.get("shipping") || "0"),
    adjustment: String(formData.get("adjustment") || "0"),
    expenseAccountId: String(formData.get("expenseAccountId") || "") || null,
    paidThroughAccountId: String(formData.get("paidThroughAccountId") || "") || null,
    recurrence: String(formData.get("recurrence") || "") || null,
    createdBy: user.id,
    lines,
  });
  revalidatePath(typePath(documentType));
  redirect(`${typePath(documentType)}/${result.id}`);
}

export async function saveContact(formData: FormData) {
  const user = await requireSession();
  const db = await getDb();
  const id = String(formData.get("id") || "") || nid();
  const contactType = String(formData.get("contactType") || "customer");
  const values = {
    id,
    organizationId: user.organizationId,
    contactType,
    displayName: String(formData.get("displayName") || ""),
    companyName: String(formData.get("companyName") || "") || null,
    email: String(formData.get("email") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    gstin: String(formData.get("gstin") || "") || null,
    currency: String(formData.get("currency") || "INR"),
    billingStreet: String(formData.get("billingStreet") || "") || null,
    billingCity: String(formData.get("billingCity") || "") || null,
    billingState: String(formData.get("billingState") || "") || null,
    billingPostal: String(formData.get("billingPostal") || "") || null,
    billingCountry: String(formData.get("billingCountry") || "India"),
    notes: String(formData.get("notes") || "") || null,
    portalEnabled: formData.get("portalEnabled") === "on",
  };
  const existing = (await db.select().from(contacts).where(eq(contacts.id, id)))[0];
  if (existing) await db.update(contacts).set(values).where(eq(contacts.id, id));
  else await db.insert(contacts).values(values);
  const path = contactType === "vendor" ? "/purchases/vendors" : "/sales/customers";
  revalidatePath(path);
  redirect(`${path}/${id}`);
}

export async function saveItem(formData: FormData) {
  const user = await requireSession();
  const db = await getDb();
  const id = String(formData.get("id") || "") || nid();
  const values = {
    id,
    organizationId: user.organizationId,
    itemType: String(formData.get("itemType") || "goods"),
    name: String(formData.get("name") || ""),
    sku: String(formData.get("sku") || "") || null,
    unit: String(formData.get("unit") || "pcs"),
    hsn: String(formData.get("hsn") || "") || null,
    description: String(formData.get("description") || "") || null,
    saleRate: String(formData.get("saleRate") || "0"),
    purchaseRate: String(formData.get("purchaseRate") || "0"),
    taxId: String(formData.get("taxId") || "") || null,
    trackInventory: formData.get("trackInventory") === "on",
    stockOnHand: String(formData.get("stockOnHand") || "0"),
    reorderPoint: String(formData.get("reorderPoint") || "0"),
  };
  const existing = (await db.select().from(items).where(eq(items.id, id)))[0];
  if (existing) await db.update(items).set(values).where(eq(items.id, id));
  else await db.insert(items).values(values);
  revalidatePath("/items");
  redirect(`/items/${id}`);
}

export async function recordPaymentAction(formData: FormData) {
  const user = await requireSession();
  await recordPayment(await getDb(), {
    organizationId: user.organizationId,
    paymentType: String(formData.get("paymentType") || "received") as "received" | "made",
    contactId: String(formData.get("contactId")),
    date: String(formData.get("date")),
    amount: String(formData.get("amount")),
    method: String(formData.get("method") || "bank_transfer"),
    accountId: String(formData.get("accountId") || "") || undefined,
    reference: String(formData.get("reference") || "") || undefined,
    allocations: [
      {
        transactionId: String(formData.get("transactionId")),
        amount: String(formData.get("amount")),
      },
    ],
  });
  revalidatePath("/sales/invoices");
  revalidatePath("/purchases/bills");
  redirect(String(formData.get("redirectTo") || "/home"));
}

export async function categorizeBank(formData: FormData) {
  await requireSession();
  const db = await getDb();
  const id = String(formData.get("id"));
  const categoryAccountId = String(formData.get("categoryAccountId"));
  const txn = (await db.select().from(bankTransactions).where(eq(bankTransactions.id, id)))[0];
  if (!txn) return;
  const user = (await auth())!.user;
  const amount = txn.amount;
  const isIn = Number(amount) > 0;
  await postJournal(db, {
    organizationId: user.organizationId,
    date: txn.date,
    notes: txn.description,
    sourceType: "bank_categorize",
    sourceId: id,
    lines: isIn
      ? [
          { accountId: txn.accountId, debit: amount, description: txn.description },
          { accountId: categoryAccountId, credit: amount, description: txn.description },
        ]
      : [
          { accountId: categoryAccountId, debit: String(Math.abs(Number(amount))), description: txn.description },
          { accountId: txn.accountId, credit: String(Math.abs(Number(amount))), description: txn.description },
        ],
  });
  await db
    .update(bankTransactions)
    .set({ status: "categorized", categoryAccountId })
    .where(eq(bankTransactions.id, id));
  revalidatePath("/banking");
}

export async function matchBank(formData: FormData) {
  await requireSession();
  const db = await getDb();
  await db
    .update(bankTransactions)
    .set({
      status: "matched",
      matchedTransactionId: String(formData.get("matchedTransactionId")),
    })
    .where(eq(bankTransactions.id, String(formData.get("id"))));
  revalidatePath("/banking");
}

export async function saveAccount(formData: FormData) {
  const user = await requireSession();
  const db = await getDb();
  await db.insert(accounts).values({
    id: nid(),
    organizationId: user.organizationId,
    code: String(formData.get("code")),
    name: String(formData.get("name")),
    category: String(formData.get("category")),
    accountType: String(formData.get("accountType")),
    description: String(formData.get("description") || "") || null,
    isSystem: false,
  });
  revalidatePath("/accountant/chart-of-accounts");
}

export async function saveManualJournal(formData: FormData) {
  const user = await requireSession();
  const raw = String(formData.get("linesJson") ?? "[]");
  const lines = z
    .array(
      z.object({
        accountId: z.string(),
        debit: z.string().default("0"),
        credit: z.string().default("0"),
        description: z.string().optional(),
      }),
    )
    .parse(JSON.parse(raw));
  await postJournal(await getDb(), {
    organizationId: user.organizationId,
    date: String(formData.get("date")),
    notes: String(formData.get("notes") || "") || undefined,
    sourceType: "manual",
    lines,
  });
  revalidatePath("/accountant/journals");
  redirect("/accountant/journals");
}

export async function saveProject(formData: FormData) {
  const user = await requireSession();
  const db = await getDb();
  await db.insert(projects).values({
    id: nid(),
    organizationId: user.organizationId,
    contactId: String(formData.get("contactId") || "") || null,
    name: String(formData.get("name")),
    code: String(formData.get("code") || "") || null,
    billingMethod: String(formData.get("billingMethod") || "hourly"),
    hourlyRate: String(formData.get("hourlyRate") || "0"),
    budgetHours: String(formData.get("budgetHours") || "0"),
    description: String(formData.get("description") || "") || null,
  });
  revalidatePath("/time/projects");
  redirect("/time/projects");
}

export async function saveTimesheet(formData: FormData) {
  const user = await requireSession();
  const db = await getDb();
  await db.insert(timesheets).values({
    id: nid(),
    organizationId: user.organizationId,
    projectId: String(formData.get("projectId")),
    userId: user.id,
    date: String(formData.get("date")),
    hours: String(formData.get("hours")),
    notes: String(formData.get("notes") || "") || null,
    billable: formData.get("billable") === "on",
  });
  revalidatePath("/time/timesheet");
  redirect("/time/timesheet");
}

export async function approveQuotePortal(id: string) {
  const user = await requireSession();
  if (user.role !== "portal") throw new Error("Forbidden");
  const db = await getDb();
  const { transactions } = await import("@/lib/db/schema");
  await db.update(transactions).set({ status: "accepted" }).where(eq(transactions.id, id));
  revalidatePath("/portal");
}
