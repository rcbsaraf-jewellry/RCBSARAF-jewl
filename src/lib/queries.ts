import { and, desc, eq } from "drizzle-orm";
import { accountBalances } from "@/lib/accounting/engine";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { getDb } from "@/lib/db/client";
import {
  accounts,
  bankTransactions,
  contactPersons,
  contacts,
  items,
  journalLines,
  journals,
  organizations,
  payments,
  projects,
  taxes,
  timesheets,
  transactionLines,
  transactions,
  users,
} from "@/lib/db/schema";
import { add, formatINR, gt, m } from "@/lib/money";
import { requireSession } from "@/auth";

export async function currentOrg() {
  const user = await requireSession();
  const db = await getDb();
  const org = (await db.select().from(organizations).where(eq(organizations.id, user.organizationId)))[0];
  return { user, org, db };
}

export async function listContacts(type: "customer" | "vendor" | "all") {
  const { db, user } = await currentOrg();
  const rows = await db
    .select()
    .from(contacts)
    .where(
      type === "all"
        ? eq(contacts.organizationId, user.organizationId)
        : and(eq(contacts.organizationId, user.organizationId), eq(contacts.contactType, type)),
    );
  return rows;
}

export async function getContact(id: string) {
  const { db } = await currentOrg();
  const contact = (await db.select().from(contacts).where(eq(contacts.id, id)))[0];
  const persons = contact ? await db.select().from(contactPersons).where(eq(contactPersons.contactId, id)) : [];
  const docs = contact
    ? await db.select().from(transactions).where(eq(transactions.contactId, id)).orderBy(desc(transactions.date))
    : [];
  return { contact, persons, docs };
}

export async function listItems() {
  const { db, user } = await currentOrg();
  return db.select().from(items).where(eq(items.organizationId, user.organizationId));
}

export async function getItem(id: string) {
  const { db } = await currentOrg();
  return (await db.select().from(items).where(eq(items.id, id)))[0];
}

export async function listTransactions(type: DocumentType, opts?: { status?: string; q?: string }) {
  const { db, user } = await currentOrg();
  const rows = await db
    .select({
      txn: transactions,
      contactName: contacts.displayName,
    })
    .from(transactions)
    .leftJoin(contacts, eq(contacts.id, transactions.contactId))
    .where(
      and(
        eq(transactions.organizationId, user.organizationId),
        eq(transactions.documentType, type),
        opts?.status && opts.status !== "all" ? eq(transactions.status, opts.status) : undefined,
      ),
    )
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
  const q = opts?.q?.toLowerCase();
  return q
    ? rows.filter(
        (r) =>
          r.txn.number.toLowerCase().includes(q) ||
          (r.contactName ?? "").toLowerCase().includes(q) ||
          (r.txn.subject ?? "").toLowerCase().includes(q),
      )
    : rows;
}

export async function getTransaction(id: string) {
  const { db } = await currentOrg();
  const txn = (await db.select().from(transactions).where(eq(transactions.id, id)))[0];
  if (!txn) return null;
  const lines = await db
    .select()
    .from(transactionLines)
    .where(eq(transactionLines.transactionId, id));
  const contact = txn.contactId
    ? (await db.select().from(contacts).where(eq(contacts.id, txn.contactId)))[0]
    : null;
  const journal = txn.journalId
    ? await db
        .select({ line: journalLines, accountName: accounts.name, accountCode: accounts.code })
        .from(journalLines)
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(eq(journalLines.journalId, txn.journalId))
    : [];
  return { txn, lines, contact, journal };
}

export async function formLookups() {
  const { db, user } = await currentOrg();
  const [customerRows, vendorRows, itemRows, taxRows, accountRows] = await Promise.all([
    db.select().from(contacts).where(and(eq(contacts.organizationId, user.organizationId), eq(contacts.contactType, "customer"))),
    db.select().from(contacts).where(and(eq(contacts.organizationId, user.organizationId), eq(contacts.contactType, "vendor"))),
    db.select().from(items).where(eq(items.organizationId, user.organizationId)),
    db.select().from(taxes).where(eq(taxes.organizationId, user.organizationId)),
    db.select().from(accounts).where(eq(accounts.organizationId, user.organizationId)),
  ]);
  return { customers: customerRows, vendors: vendorRows, items: itemRows, taxes: taxRows, accounts: accountRows };
}

export async function dashboardData() {
  const { db, user, org } = await currentOrg();
  const invoices = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.organizationId, user.organizationId), eq(transactions.documentType, "invoice")));
  const bills = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.organizationId, user.organizationId), eq(transactions.documentType, "bill")));
  const expenses = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.organizationId, user.organizationId), eq(transactions.documentType, "expense")));

  const receivableCurrent = invoices
    .filter((i) => ["sent", "open", "partially_paid"].includes(i.status))
    .reduce((s, i) => add(s, i.balance), "0");
  const receivableOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => add(s, i.balance), "0");
  const payableCurrent = bills
    .filter((i) => ["open", "sent", "partially_paid"].includes(i.status))
    .reduce((s, i) => add(s, i.balance), "0");
  const payableOverdue = bills
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => add(s, i.balance), "0");

  const balances = await accountBalances(db, user.organizationId);
  const income = balances.filter((a) => a.category === "income").reduce((s, a) => add(s, a.balance), "0");
  const expense = balances.filter((a) => a.category === "expense").reduce((s, a) => add(s, a.balance), "0");
  const cashAccounts = balances.filter((a) => ["cash", "bank"].includes(a.accountType));
  const topExpenses = balances
    .filter((a) => a.category === "expense" && gt(a.balance, 0))
    .sort((a, b) => m(b.balance).cmp(m(a.balance)))
    .slice(0, 6);

  const recent = await db
    .select({ txn: transactions, contactName: contacts.displayName })
    .from(transactions)
    .leftJoin(contacts, eq(contacts.id, transactions.contactId))
    .where(eq(transactions.organizationId, user.organizationId))
    .orderBy(desc(transactions.createdAt));

  const watch = balances.filter((a) =>
    ["1010", "1100", "2000", "6000"].includes(a.code),
  );

  const projectRows = await db.select().from(projects).where(eq(projects.organizationId, user.organizationId));
  const timeRows = await db.select().from(timesheets).where(eq(timesheets.organizationId, user.organizationId));

  return {
    org,
    currency: org?.baseCurrency ?? "INR",
    receivables: { current: receivableCurrent, overdue: receivableOverdue, total: add(receivableCurrent, receivableOverdue) },
    payables: { current: payableCurrent, overdue: payableOverdue, total: add(payableCurrent, payableOverdue) },
    income,
    expense,
    profit: m(income).minus(m(expense)).toFixed(2),
    cashAccounts,
    topExpenses,
    recent: recent.slice(0, 8),
    watch,
    projects: projectRows,
    unbilledHours: timeRows.filter((t) => t.billable && !t.billed).reduce((s, t) => add(s, t.hours), "0"),
    invoices,
    bills,
    expenses,
    format: (v: string) => formatINR(v, org?.baseCurrency ?? "INR"),
  };
}

export async function listAccounts() {
  const { db, user } = await currentOrg();
  const rows = await db.select().from(accounts).where(eq(accounts.organizationId, user.organizationId));
  const balances = await accountBalances(db, user.organizationId);
  const map = new Map(balances.map((b) => [b.id, b]));
  return rows.map((a) => ({ ...a, balance: map.get(a.id)?.balance ?? "0" }));
}

export async function listJournals() {
  const { db, user } = await currentOrg();
  return db.select().from(journals).where(eq(journals.organizationId, user.organizationId)).orderBy(desc(journals.date));
}

export async function getJournal(id: string) {
  const { db } = await currentOrg();
  const journal = (await db.select().from(journals).where(eq(journals.id, id)))[0];
  const lines = journal
    ? await db
        .select({ line: journalLines, accountName: accounts.name, accountCode: accounts.code })
        .from(journalLines)
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(eq(journalLines.journalId, id))
    : [];
  return { journal, lines };
}

export async function listBank(accountId?: string) {
  const { db, user } = await currentOrg();
  const bankAccounts = (await listAccounts()).filter((a) => ["bank", "cash", "credit_card"].includes(a.accountType));
  const preferred = bankAccounts.find((a) => a.accountType === "bank") ?? bankAccounts[0];
  const selected = accountId ?? preferred?.id;
  const txns = selected
    ? await db
        .select()
        .from(bankTransactions)
        .where(and(eq(bankTransactions.organizationId, user.organizationId), eq(bankTransactions.accountId, selected)))
        .orderBy(desc(bankTransactions.date))
    : [];
  return { bankAccounts, selected, txns };
}

export async function listPayments(type: "received" | "made") {
  const { db, user } = await currentOrg();
  return db
    .select({ payment: payments, contactName: contacts.displayName })
    .from(payments)
    .leftJoin(contacts, eq(contacts.id, payments.contactId))
    .where(and(eq(payments.organizationId, user.organizationId), eq(payments.paymentType, type)))
    .orderBy(desc(payments.date));
}

export async function listProjects() {
  const { db, user } = await currentOrg();
  const projectRows = await db.select().from(projects).where(eq(projects.organizationId, user.organizationId));
  const timeRows = await db.select().from(timesheets).where(eq(timesheets.organizationId, user.organizationId));
  return projectRows.map((p) => ({
    ...p,
    hours: timeRows.filter((t) => t.projectId === p.id).reduce((s, t) => add(s, t.hours), "0"),
    unbilled: timeRows.filter((t) => t.projectId === p.id && t.billable && !t.billed).reduce((s, t) => add(s, t.hours), "0"),
  }));
}

export async function listTimesheets() {
  const { db, user } = await currentOrg();
  return db.select().from(timesheets).where(eq(timesheets.organizationId, user.organizationId)).orderBy(desc(timesheets.date));
}

export async function listStaff() {
  const { db, user } = await currentOrg();
  return db.select().from(users).where(eq(users.organizationId, user.organizationId));
}

export async function reportsBundle() {
  const { db, user, org } = await currentOrg();
  const balances = await accountBalances(db, user.organizationId);
  const income = balances.filter((a) => a.category === "income");
  const expense = balances.filter((a) => a.category === "expense");
  const assets = balances.filter((a) => a.category === "asset");
  const liabilities = balances.filter((a) => a.category === "liability");
  const equity = balances.filter((a) => a.category === "equity");
  const invoices = await db
    .select({ txn: transactions, contactName: contacts.displayName })
    .from(transactions)
    .leftJoin(contacts, eq(contacts.id, transactions.contactId))
    .where(and(eq(transactions.organizationId, user.organizationId), eq(transactions.documentType, "invoice")));
  const bills = await db
    .select({ txn: transactions, contactName: contacts.displayName })
    .from(transactions)
    .leftJoin(contacts, eq(contacts.id, transactions.contactId))
    .where(and(eq(transactions.organizationId, user.organizationId), eq(transactions.documentType, "bill")));

  const ageBuckets = (rows: typeof invoices) => {
    const today = new Date().toISOString().slice(0, 10);
    const buckets = { current: "0", d30: "0", d60: "0", d90: "0", older: "0" };
    for (const r of rows) {
      if (!gt(r.txn.balance, 0)) continue;
      const due = r.txn.dueDate ?? r.txn.date;
      const days = Math.max(0, Math.floor((Date.parse(today) - Date.parse(due)) / 86400000));
      const key = days <= 0 ? "current" : days <= 30 ? "d30" : days <= 60 ? "d60" : days <= 90 ? "d90" : "older";
      buckets[key] = add(buckets[key], r.txn.balance);
    }
    return buckets;
  };

  return {
    org,
    balances,
    income,
    expense,
    assets,
    liabilities,
    equity,
    invoices,
    bills,
    arAging: ageBuckets(invoices),
    apAging: ageBuckets(bills),
    currency: org?.baseCurrency ?? "INR",
  };
}

export function docTitle(type: DocumentType) {
  return TYPE_META[type].plural;
}
