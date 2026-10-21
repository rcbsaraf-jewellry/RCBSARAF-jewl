export const DOCUMENT_TYPES = [
  "quote",
  "sales_order",
  "delivery_challan",
  "invoice",
  "recurring_invoice",
  "retainer_invoice",
  "credit_note",
  "purchase_order",
  "bill",
  "recurring_bill",
  "vendor_credit",
  "expense",
  "mileage",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const SALES_TYPES: DocumentType[] = [
  "quote",
  "sales_order",
  "delivery_challan",
  "invoice",
  "recurring_invoice",
  "retainer_invoice",
  "credit_note",
];

export const PURCHASE_TYPES: DocumentType[] = [
  "purchase_order",
  "bill",
  "recurring_bill",
  "vendor_credit",
  "expense",
  "mileage",
];

export const POSTING_TYPES: DocumentType[] = [
  "invoice",
  "retainer_invoice",
  "credit_note",
  "bill",
  "vendor_credit",
  "expense",
  "mileage",
];

export const TYPE_META: Record<
  DocumentType,
  {
    label: string;
    plural: string;
    prefix: string;
    group: "sales" | "purchases";
    contact: "customer" | "vendor";
    postsLedger: boolean;
    inventoryDir: 0 | 1 | -1;
  }
> = {
  quote: {
    label: "Quote",
    plural: "Quotes",
    prefix: "QT",
    group: "sales",
    contact: "customer",
    postsLedger: false,
    inventoryDir: 0,
  },
  sales_order: {
    label: "Sales Order",
    plural: "Sales Orders",
    prefix: "SO",
    group: "sales",
    contact: "customer",
    postsLedger: false,
    inventoryDir: 0,
  },
  delivery_challan: {
    label: "Delivery Challan",
    plural: "Delivery Challans",
    prefix: "DC",
    group: "sales",
    contact: "customer",
    postsLedger: false,
    inventoryDir: -1,
  },
  invoice: {
    label: "Invoice",
    plural: "Invoices",
    prefix: "INV",
    group: "sales",
    contact: "customer",
    postsLedger: true,
    inventoryDir: -1,
  },
  recurring_invoice: {
    label: "Recurring Invoice",
    plural: "Recurring Invoices",
    prefix: "RINV",
    group: "sales",
    contact: "customer",
    postsLedger: false,
    inventoryDir: 0,
  },
  retainer_invoice: {
    label: "Retainer Invoice",
    plural: "Retainer Invoices",
    prefix: "RET",
    group: "sales",
    contact: "customer",
    postsLedger: true,
    inventoryDir: 0,
  },
  credit_note: {
    label: "Credit Note",
    plural: "Credit Notes",
    prefix: "CN",
    group: "sales",
    contact: "customer",
    postsLedger: true,
    inventoryDir: 1,
  },
  purchase_order: {
    label: "Purchase Order",
    plural: "Purchase Orders",
    prefix: "PO",
    group: "purchases",
    contact: "vendor",
    postsLedger: false,
    inventoryDir: 0,
  },
  bill: {
    label: "Bill",
    plural: "Bills",
    prefix: "BILL",
    group: "purchases",
    contact: "vendor",
    postsLedger: true,
    inventoryDir: 1,
  },
  recurring_bill: {
    label: "Recurring Bill",
    plural: "Recurring Bills",
    prefix: "RBILL",
    group: "purchases",
    contact: "vendor",
    postsLedger: false,
    inventoryDir: 0,
  },
  vendor_credit: {
    label: "Vendor Credit",
    plural: "Vendor Credits",
    prefix: "VC",
    group: "purchases",
    contact: "vendor",
    postsLedger: true,
    inventoryDir: -1,
  },
  expense: {
    label: "Expense",
    plural: "Expenses",
    prefix: "EXP",
    group: "purchases",
    contact: "vendor",
    postsLedger: true,
    inventoryDir: 0,
  },
  mileage: {
    label: "Mileage",
    plural: "Mileage",
    prefix: "MIL",
    group: "purchases",
    contact: "vendor",
    postsLedger: true,
    inventoryDir: 0,
  },
};

export const STATUS_META: Record<string, { label: string; tone: "slate" | "blue" | "amber" | "red" | "green" | "violet" | "zinc" }> = {
  draft: { label: "Draft", tone: "slate" },
  sent: { label: "Sent", tone: "blue" },
  accepted: { label: "Accepted", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  invoiced: { label: "Invoiced", tone: "violet" },
  open: { label: "Open", tone: "blue" },
  overdue: { label: "Overdue", tone: "red" },
  paid: { label: "Paid", tone: "green" },
  partially_paid: { label: "Partially Paid", tone: "amber" },
  void: { label: "Void", tone: "zinc" },
  closed: { label: "Closed", tone: "slate" },
  active: { label: "Active", tone: "green" },
  stopped: { label: "Stopped", tone: "slate" },
  unmatched: { label: "Uncategorized", tone: "amber" },
  matched: { label: "Matched", tone: "blue" },
  categorized: { label: "Categorized", tone: "green" },
  reconciled: { label: "Reconciled", tone: "green" },
  issued: { label: "Issued", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  billed: { label: "Billed", tone: "violet" },
  confirmed: { label: "Confirmed", tone: "blue" },
  unpaid: { label: "Unpaid", tone: "blue" },
};

export const ROLES = {
  admin: {
    label: "Admin",
    permissions: ["*"],
  },
  accountant: {
    label: "Accountant",
    permissions: ["ledger", "reports", "banking", "journals", "settings.tax"],
  },
  sales: {
    label: "Salesperson",
    permissions: ["sales", "customers", "items.read"],
  },
  billing: {
    label: "Billing",
    permissions: ["sales", "invoices", "payments", "customers"],
  },
  store_manager: {
    label: "Store Manager",
    permissions: ["inventory", "items", "purchases.read"],
  },
  business_owner: {
    label: "Business Owner",
    permissions: ["*"],
  },
  purchases: {
    label: "Purchases",
    permissions: ["purchases", "vendors", "expenses", "items.read"],
  },
  auditor: {
    label: "Auditor",
    permissions: ["reports", "ledger.read", "audit"],
  },
  portal: {
    label: "Customer Portal",
    permissions: ["portal"],
  },
} as const;

export type Role = keyof typeof ROLES;

export const ACCOUNT_CODES = {
  cash: "1000",
  bank: "1010",
  undeposited: "1020",
  ar: "1100",
  inventory: "1200",
  inputGst: "1300",
  prepaid: "1500",
  fixedAssets: "1600",
  ap: "2000",
  outputGst: "2100",
  tds: "2200",
  creditCard: "2300",
  equity: "3000",
  retained: "3100",
  sales: "4000",
  making: "4100",
  otherIncome: "4200",
  cogs: "5000",
  purchases: "5100",
  rent: "6000",
  salaries: "6100",
  utilities: "6200",
  marketing: "6300",
  bankCharges: "6400",
  travel: "6500",
  supplies: "6600",
  insurance: "6700",
  depreciation: "6800",
  misc: "6900",
} as const;

export function accId(code: string) {
  return `acc_${code}`;
}
