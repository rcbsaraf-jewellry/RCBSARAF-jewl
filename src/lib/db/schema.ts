import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 19, scale: 4 }).notNull().default("0");

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  industry: text("industry"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  gstin: text("gstin"),
  pan: text("pan"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull().default("India"),
  baseCurrency: text("base_currency").notNull().default("INR"),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(4),
  logoText: text("logo_text").notNull().default("SB"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  contactId: text("contact_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_idx").on(t.email)]);

export const otpChallenges = pgTable("otp_challenges", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  requestIp: text("request_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("otp_email_role_idx").on(t.email, t.role)]);

export const authGrants = pgTable("auth_grants", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginFingerprints = pgTable("login_fingerprints", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  fingerprint: text("fingerprint").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  accountType: text("account_type").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  isWatchlist: boolean("is_watchlist").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  parentId: text("parent_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("accounts_org_code_idx").on(t.organizationId, t.code),
  index("accounts_org_cat_idx").on(t.organizationId, t.category),
]);

export const taxes = pgTable("taxes", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  rate: money("rate"),
  taxType: text("tax_type").notNull().default("gst"),
  isRecoverable: boolean("is_recoverable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

export const paymentTerms = pgTable("payment_terms", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  days: integer("days").notNull().default(0),
});

export const numberSeries = pgTable("number_series", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  documentType: text("document_type").notNull(),
  prefix: text("prefix").notNull(),
  nextNumber: integer("next_number").notNull().default(1),
  padding: integer("padding").notNull().default(4),
}, (t) => [uniqueIndex("series_org_type_idx").on(t.organizationId, t.documentType)]);

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  contactType: text("contact_type").notNull(),
  displayName: text("display_name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  website: text("website"),
  gstin: text("gstin"),
  pan: text("pan"),
  currency: text("currency").notNull().default("INR"),
  paymentTermId: text("payment_term_id"),
  billingStreet: text("billing_street"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingPostal: text("billing_postal"),
  billingCountry: text("billing_country").default("India"),
  shippingStreet: text("shipping_street"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostal: text("shipping_postal"),
  shippingCountry: text("shipping_country").default("India"),
  notes: text("notes"),
  creditLimit: money("credit_limit"),
  openingBalance: money("opening_balance"),
  portalEnabled: boolean("portal_enabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("contacts_org_type_idx").on(t.organizationId, t.contactType),
  index("contacts_name_idx").on(t.organizationId, t.displayName),
]);

export const contactPersons = pgTable("contact_persons", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  designation: text("designation"),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  itemType: text("item_type").notNull(),
  name: text("name").notNull(),
  sku: text("sku"),
  upc: text("upc"),
  unit: text("unit").notNull().default("pcs"),
  hsn: text("hsn"),
  description: text("description"),
  saleRate: money("sale_rate"),
  purchaseRate: money("purchase_rate"),
  salesAccountId: text("sales_account_id"),
  purchaseAccountId: text("purchase_account_id"),
  inventoryAccountId: text("inventory_account_id"),
  taxId: text("tax_id"),
  trackInventory: boolean("track_inventory").notNull().default(false),
  stockOnHand: money("stock_on_hand"),
  reorderPoint: money("reorder_point"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("items_org_idx").on(t.organizationId, t.name)]);

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  documentType: text("document_type").notNull(),
  number: text("number").notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("draft"),
  contactId: text("contact_id"),
  date: text("date").notNull(),
  dueDate: text("due_date"),
  paymentTermId: text("payment_term_id"),
  salesperson: text("salesperson"),
  subject: text("subject"),
  notes: text("notes"),
  terms: text("terms"),
  currency: text("currency").notNull().default("INR"),
  exchangeRate: money("exchange_rate"),
  subTotal: money("sub_total"),
  discountTotal: money("discount_total"),
  taxTotal: money("tax_total"),
  shipping: money("shipping"),
  adjustment: money("adjustment"),
  total: money("total"),
  balance: money("balance"),
  paid: money("paid"),
  sourceId: text("source_id"),
  projectId: text("project_id"),
  depositAccountId: text("deposit_account_id"),
  expenseAccountId: text("expense_account_id"),
  paidThroughAccountId: text("paid_through_account_id"),
  recurrence: text("recurrence"),
  journalId: text("journal_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("txn_org_type_number_idx").on(t.organizationId, t.documentType, t.number),
  index("txn_org_type_status_idx").on(t.organizationId, t.documentType, t.status),
  index("txn_contact_idx").on(t.contactId),
  index("txn_date_idx").on(t.organizationId, t.date),
]);

export const transactionLines = pgTable("transaction_lines", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id),
  lineNo: integer("line_no").notNull(),
  itemId: text("item_id"),
  description: text("description"),
  accountId: text("account_id"),
  quantity: money("quantity"),
  rate: money("rate"),
  discountPct: money("discount_pct"),
  taxId: text("tax_id"),
  taxPct: money("tax_pct"),
  taxable: money("taxable"),
  taxAmount: money("tax_amount"),
  amount: money("amount"),
  projectId: text("project_id"),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  paymentType: text("payment_type").notNull(),
  number: text("number").notNull(),
  contactId: text("contact_id"),
  date: text("date").notNull(),
  amount: money("amount"),
  unused: money("unused"),
  method: text("method").notNull().default("bank_transfer"),
  accountId: text("account_id"),
  reference: text("reference"),
  notes: text("notes"),
  journalId: text("journal_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentAllocations = pgTable("payment_allocations", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id),
  amount: money("amount"),
});

export const journals = pgTable("journals", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  number: text("number").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("published"),
  sourceType: text("source_type").notNull().default("manual"),
  sourceId: text("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("journals_org_date_idx").on(t.organizationId, t.date)]);

export const journalLines = pgTable("journal_lines", {
  id: text("id").primaryKey(),
  journalId: text("journal_id")
    .notNull()
    .references(() => journals.id),
  lineNo: integer("line_no").notNull(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  contactId: text("contact_id"),
  description: text("description"),
  debit: money("debit"),
  credit: money("credit"),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  date: text("date").notNull(),
  description: text("description").notNull(),
  payee: text("payee"),
  reference: text("reference"),
  amount: money("amount"),
  status: text("status").notNull().default("unmatched"),
  matchedTransactionId: text("matched_transaction_id"),
  categoryAccountId: text("category_account_id"),
  ruleId: text("rule_id"),
  imported: boolean("imported").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("bank_txn_acct_status_idx").on(t.accountId, t.status)]);

export const bankRules = pgTable("bank_rules", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  applyOn: text("apply_on").notNull().default("description"),
  contains: text("contains").notNull(),
  categoryAccountId: text("category_account_id").notNull(),
  contactId: text("contact_id"),
  isActive: boolean("is_active").notNull().default(true),
});

export const reconciliations = pgTable("reconciliations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  accountId: text("account_id").notNull(),
  statementDate: text("statement_date").notNull(),
  statementBalance: money("statement_balance"),
  bookBalance: money("book_balance"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  date: text("date").notNull(),
  reason: text("reason").notNull(),
  quantity: money("quantity"),
  unitCost: money("unit_cost"),
  sourceType: text("source_type"),
  sourceId: text("source_id"),
  notes: text("notes"),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  contactId: text("contact_id"),
  name: text("name").notNull(),
  code: text("code"),
  billingMethod: text("billing_method").notNull().default("hourly"),
  hourlyRate: money("hourly_rate"),
  budgetHours: money("budget_hours"),
  status: text("status").notNull().default("active"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  billable: boolean("billable").notNull().default(true),
  rate: money("rate"),
  status: text("status").notNull().default("open"),
});

export const timesheets = pgTable("timesheets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  taskId: text("task_id"),
  userId: text("user_id"),
  contactId: text("contact_id"),
  date: text("date").notNull(),
  hours: money("hours"),
  notes: text("notes"),
  billable: boolean("billable").notNull().default(true),
  billed: boolean("billed").notNull().default(false),
  invoiceId: text("invoice_id"),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  mime: text("mime"),
  size: integer("size").notNull().default(0),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  userId: text("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
