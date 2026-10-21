import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { recordPayment, saveTransaction } from "@/lib/accounting/engine";
import { ACCOUNT_CODES, accId } from "@/lib/catalog";
import type { Database } from "@/lib/db/client";
import {
  accounts,
  bankRules,
  bankTransactions,
  contactPersons,
  contacts,
  items,
  numberSeries,
  organizations,
  paymentTerms,
  projectTasks,
  projects,
  taxes,
  timesheets,
  users,
} from "@/lib/db/schema";
import { nid } from "@/lib/utils";

const ORG = "org_rcb";

const COA: Array<{
  code: string;
  name: string;
  category: "asset" | "liability" | "equity" | "income" | "expense";
  accountType: string;
  watch?: boolean;
}> = [
  { code: "1000", name: "Petty Cash", category: "asset", accountType: "cash" },
  { code: "1010", name: "HDFC Bank - Current", category: "asset", accountType: "bank", watch: true },
  { code: "1020", name: "Undeposited Funds", category: "asset", accountType: "payment_clearing" },
  { code: "1100", name: "Accounts Receivable", category: "asset", accountType: "accounts_receivable" },
  { code: "1200", name: "Inventory Asset", category: "asset", accountType: "stock" },
  { code: "1300", name: "Input GST", category: "asset", accountType: "other_current_asset" },
  { code: "1500", name: "Prepaid Expenses", category: "asset", accountType: "other_current_asset" },
  { code: "1600", name: "Furniture & Fixtures", category: "asset", accountType: "fixed_asset" },
  { code: "2000", name: "Accounts Payable", category: "liability", accountType: "accounts_payable" },
  { code: "2100", name: "Output GST", category: "liability", accountType: "other_current_liability" },
  { code: "2200", name: "TDS Payable", category: "liability", accountType: "other_current_liability" },
  { code: "2300", name: "HDFC Credit Card", category: "liability", accountType: "credit_card" },
  { code: "3000", name: "Owner's Equity", category: "equity", accountType: "equity" },
  { code: "3100", name: "Retained Earnings", category: "equity", accountType: "equity" },
  { code: "4000", name: "Sales", category: "income", accountType: "income" },
  { code: "4100", name: "Making Charges", category: "income", accountType: "income" },
  { code: "4200", name: "Other Income", category: "income", accountType: "other_income" },
  { code: "5000", name: "Cost of Goods Sold", category: "expense", accountType: "expense" },
  { code: "5100", name: "Purchases", category: "expense", accountType: "expense" },
  { code: "6000", name: "Rent", category: "expense", accountType: "expense", watch: true },
  { code: "6100", name: "Salaries & Wages", category: "expense", accountType: "expense" },
  { code: "6200", name: "Utilities", category: "expense", accountType: "expense" },
  { code: "6300", name: "Marketing", category: "expense", accountType: "expense" },
  { code: "6400", name: "Bank Charges", category: "expense", accountType: "expense" },
  { code: "6500", name: "Travel", category: "expense", accountType: "expense" },
  { code: "6600", name: "Office Supplies", category: "expense", accountType: "expense" },
  { code: "6700", name: "Insurance", category: "expense", accountType: "expense" },
  { code: "6800", name: "Depreciation", category: "expense", accountType: "expense" },
  { code: "6900", name: "Miscellaneous Expense", category: "expense", accountType: "expense" },
];

export async function seedIfEmpty(db: Database) {
  const [{ value }] = await db.select({ value: count() }).from(organizations);
  if (Number(value) > 0) return;

  const passwordHash = bcrypt.hashSync("Sarafa@123", 10);

  await db.insert(organizations).values({
    id: ORG,
    name: "RCB Sarafa Jewellers",
    legalName: "RCB Sarafa Jewellers Private Limited",
    industry: "Jewellery wholesale & retail",
    email: "accounts@rcbsarafa.com",
    phone: "+91 22 2242 1188",
    website: "https://rcbsarafa.example",
    gstin: "27AABCR1234M1Z5",
    pan: "AABCR1234M",
    addressLine1: "42 Zaveri Bazaar",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400002",
    country: "India",
    baseCurrency: "INR",
    logoText: "RCB",
  });

  await db.insert(users).values([
    {
      id: "user_admin",
      organizationId: ORG,
      name: "Sahil Mehta",
      email: "admin@rcbsarafa.com",
      passwordHash,
      role: "admin",
    },
    {
      id: "user_acct",
      organizationId: ORG,
      name: "Priya Shah",
      email: "accountant@rcbsarafa.com",
      passwordHash,
      role: "accountant",
    },
    {
      id: "user_sales",
      organizationId: ORG,
      name: "Arjun Kapoor",
      email: "sales@rcbsarafa.com",
      passwordHash,
      role: "sales",
    },
    {
      id: "user_billing",
      organizationId: ORG,
      name: "Kavya Mehta",
      email: "billing@rcbsarafa.com",
      passwordHash,
      role: "billing",
    },
    {
      id: "user_store",
      organizationId: ORG,
      name: "Rohan Joshi",
      email: "store@rcbsarafa.com",
      passwordHash,
      role: "store_manager",
    },
    {
      id: "user_owner",
      organizationId: ORG,
      name: "Sahil Mehta",
      email: "owner@rcbsarafa.com",
      passwordHash,
      role: "business_owner",
    },
    {
      id: "user_portal",
      organizationId: ORG,
      name: "Nisha Bridal House",
      email: "portal@nishabridal.com",
      passwordHash,
      role: "portal",
      contactId: "cust_nisha",
    },
  ]);

  await db.insert(accounts).values(
    COA.map((a) => ({
      id: accId(a.code),
      organizationId: ORG,
      code: a.code,
      name: a.name,
      category: a.category,
      accountType: a.accountType,
      isSystem: true,
      isWatchlist: Boolean(a.watch),
      description: a.name,
    })),
  );

  const tax3 = "tax_gst3";
  const tax18 = "tax_gst18";
  const tax0 = "tax_ex";
  await db.insert(taxes).values([
    { id: tax0, organizationId: ORG, name: "Exempt", rate: "0", taxType: "gst" },
    { id: tax3, organizationId: ORG, name: "GST 3% (Gold)", rate: "3", taxType: "gst" },
    { id: "tax_gst5", organizationId: ORG, name: "GST 5%", rate: "5", taxType: "gst" },
    { id: "tax_gst12", organizationId: ORG, name: "GST 12%", rate: "12", taxType: "gst" },
    { id: tax18, organizationId: ORG, name: "GST 18%", rate: "18", taxType: "gst" },
    { id: "tax_gst28", organizationId: ORG, name: "GST 28%", rate: "28", taxType: "gst" },
  ]);

  await db.insert(paymentTerms).values([
    { id: "term_due", organizationId: ORG, name: "Due on Receipt", days: 0 },
    { id: "term_15", organizationId: ORG, name: "Net 15", days: 15 },
    { id: "term_30", organizationId: ORG, name: "Net 30", days: 30 },
    { id: "term_45", organizationId: ORG, name: "Net 45", days: 45 },
    { id: "term_60", organizationId: ORG, name: "Net 60", days: 60 },
  ]);

  const series = [
    ["quote", "QT-"],
    ["sales_order", "SO-"],
    ["delivery_challan", "DC-"],
    ["invoice", "INV-"],
    ["recurring_invoice", "RINV-"],
    ["retainer_invoice", "RET-"],
    ["credit_note", "CN-"],
    ["purchase_order", "PO-"],
    ["bill", "BILL-"],
    ["recurring_bill", "RBILL-"],
    ["vendor_credit", "VC-"],
    ["expense", "EXP-"],
    ["mileage", "MIL-"],
    ["journal", "JE-"],
    ["payment_received", "PR-"],
    ["payment_made", "PM-"],
  ] as const;
  await db.insert(numberSeries).values(
    series.map(([documentType, prefix]) => ({
      id: nid(),
      organizationId: ORG,
      documentType,
      prefix,
      nextNumber: 1,
      padding: 4,
    })),
  );

  await db.insert(contacts).values([
    {
      id: "cust_nisha",
      organizationId: ORG,
      contactType: "customer",
      displayName: "Nisha Bridal House",
      companyName: "Nisha Bridal House Pvt Ltd",
      email: "accounts@nishabridal.com",
      phone: "+91 22 2678 4400",
      gstin: "27AADCN8891P1Z2",
      currency: "INR",
      paymentTermId: "term_30",
      billingStreet: "12 Linking Road",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingPostal: "400050",
      billingCountry: "India",
      portalEnabled: true,
      creditLimit: "2500000",
    },
    {
      id: "cust_royal",
      organizationId: ORG,
      contactType: "customer",
      displayName: "Royal Occasions",
      companyName: "Royal Occasions",
      email: "pay@royaloccasions.in",
      phone: "+91 79 2658 1122",
      gstin: "24AABCR7788Q1Z8",
      currency: "INR",
      paymentTermId: "term_15",
      billingStreet: "CG Road",
      billingCity: "Ahmedabad",
      billingState: "Gujarat",
      billingPostal: "380009",
      billingCountry: "India",
      creditLimit: "1200000",
    },
    {
      id: "cust_meera",
      organizationId: ORG,
      contactType: "customer",
      displayName: "Meera Sethi",
      email: "meera.sethi@gmail.com",
      phone: "+91 98200 44112",
      currency: "INR",
      paymentTermId: "term_due",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingCountry: "India",
    },
    {
      id: "vend_mmtc",
      organizationId: ORG,
      contactType: "vendor",
      displayName: "MMTC Gold Bullion",
      companyName: "MMTC Limited",
      email: "bullion@mmtc.example",
      phone: "+91 11 2436 2200",
      gstin: "07AAACM1001E1Z5",
      currency: "INR",
      paymentTermId: "term_15",
      billingCity: "New Delhi",
      billingState: "Delhi",
      billingCountry: "India",
    },
    {
      id: "vend_diamond",
      organizationId: ORG,
      contactType: "vendor",
      displayName: "Surat Diamond Exchange",
      companyName: "SDE Stones LLP",
      email: "sales@sdestones.example",
      phone: "+91 261 234 8800",
      gstin: "24ABCFS2211R1Z9",
      currency: "INR",
      paymentTermId: "term_30",
      billingCity: "Surat",
      billingState: "Gujarat",
      billingCountry: "India",
    },
    {
      id: "vend_landlord",
      organizationId: ORG,
      contactType: "vendor",
      displayName: "Zaveri Estate Co.",
      email: "rent@zaveriestate.example",
      phone: "+91 22 2242 0091",
      currency: "INR",
      paymentTermId: "term_due",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingCountry: "India",
    },
  ]);

  await db.insert(contactPersons).values([
    { id: nid(), contactId: "cust_nisha", name: "Nisha Agarwal", email: "nisha@nishabridal.com", designation: "Proprietor", isPrimary: true, phone: "+91 98210 22001" },
    { id: nid(), contactId: "cust_royal", name: "Karan Desai", email: "karan@royaloccasions.in", designation: "Purchase Head", isPrimary: true, phone: "+91 98795 11880" },
    { id: nid(), contactId: "vend_mmtc", name: "Rakesh Iyer", email: "rakesh@mmtc.example", designation: "Bullion Desk", isPrimary: true, phone: "+91 98100 33445" },
  ]);

  await db.insert(items).values([
    {
      id: "item_necklace",
      organizationId: ORG,
      itemType: "goods",
      name: "22K Gold Necklace — Temple Set",
      sku: "GLD-NCK-22-001",
      unit: "set",
      hsn: "7113",
      description: "Handcrafted 22 karat temple necklace, 48.6g",
      saleRate: "428000",
      purchaseRate: "392000",
      salesAccountId: accId(ACCOUNT_CODES.sales),
      purchaseAccountId: accId(ACCOUNT_CODES.purchases),
      inventoryAccountId: accId(ACCOUNT_CODES.inventory),
      taxId: tax3,
      trackInventory: true,
      stockOnHand: "12",
      reorderPoint: "3",
    },
    {
      id: "item_ring",
      organizationId: ORG,
      itemType: "goods",
      name: "Solitaire Diamond Ring 0.50ct",
      sku: "DMD-RNG-050",
      unit: "pcs",
      hsn: "7113",
      description: "18K white gold, G-VS1 solitaire",
      saleRate: "186000",
      purchaseRate: "142000",
      salesAccountId: accId(ACCOUNT_CODES.sales),
      inventoryAccountId: accId(ACCOUNT_CODES.inventory),
      taxId: tax3,
      trackInventory: true,
      stockOnHand: "8",
      reorderPoint: "2",
    },
    {
      id: "item_bangles",
      organizationId: ORG,
      itemType: "goods",
      name: "Kundan Bridal Bangle Pair",
      sku: "KND-BNG-02",
      unit: "pair",
      hsn: "7113",
      saleRate: "96000",
      purchaseRate: "72000",
      salesAccountId: accId(ACCOUNT_CODES.sales),
      inventoryAccountId: accId(ACCOUNT_CODES.inventory),
      taxId: tax3,
      trackInventory: true,
      stockOnHand: "20",
      reorderPoint: "5",
    },
    {
      id: "item_coin",
      organizationId: ORG,
      itemType: "goods",
      name: "24K Gold Coin 10g",
      sku: "GLD-COIN-10",
      unit: "pcs",
      hsn: "7114",
      saleRate: "78500",
      purchaseRate: "76200",
      salesAccountId: accId(ACCOUNT_CODES.sales),
      inventoryAccountId: accId(ACCOUNT_CODES.inventory),
      taxId: tax3,
      trackInventory: true,
      stockOnHand: "40",
      reorderPoint: "10",
    },
    {
      id: "item_making",
      organizationId: ORG,
      itemType: "service",
      name: "Custom Making Charges",
      sku: "SVC-MAKE",
      unit: "job",
      hsn: "9988",
      saleRate: "18500",
      purchaseRate: "0",
      salesAccountId: accId(ACCOUNT_CODES.making),
      taxId: tax18,
      trackInventory: false,
    },
    {
      id: "item_repair",
      organizationId: ORG,
      itemType: "service",
      name: "Jewellery Repair & Polish",
      sku: "SVC-RPR",
      unit: "job",
      hsn: "9988",
      saleRate: "4500",
      purchaseRate: "0",
      salesAccountId: accId(ACCOUNT_CODES.making),
      taxId: tax18,
      trackInventory: false,
    },
  ]);

  await db.insert(projects).values({
    id: "proj_bridal",
    organizationId: ORG,
    contactId: "cust_nisha",
    name: "Nisha Bridal 2026 Collection",
    code: "BRD-26",
    billingMethod: "hourly",
    hourlyRate: "2500",
    budgetHours: "120",
    status: "active",
    description: "Custom bridal sets for the 2026 season lookbook",
  });
  await db.insert(projectTasks).values([
    { id: "task_design", projectId: "proj_bridal", name: "CAD Design", billable: true, rate: "2500", status: "open" },
    { id: "task_cast", projectId: "proj_bridal", name: "Casting & Setting", billable: true, rate: "2800", status: "open" },
  ]);
  await db.insert(timesheets).values([
    { id: nid(), organizationId: ORG, projectId: "proj_bridal", taskId: "task_design", userId: "user_sales", contactId: "cust_nisha", date: "2026-10-12", hours: "6", notes: "Necklace CAD iterations", billable: true, billed: false },
    { id: nid(), organizationId: ORG, projectId: "proj_bridal", taskId: "task_cast", userId: "user_admin", contactId: "cust_nisha", date: "2026-10-15", hours: "8.5", notes: "Stone setting review", billable: true, billed: false },
  ]);

  const terms = "Goods once sold will be exchanged within 7 days with original invoice. Making charges are non-refundable.";

  const inv1 = await saveTransaction(db, {
    organizationId: ORG,
    documentType: "invoice",
    status: "sent",
    contactId: "cust_nisha",
    date: "2026-09-18",
    dueDate: "2026-10-18",
    paymentTermId: "term_30",
    salesperson: "Arjun Kapoor",
    subject: "Bridal temple set — Autumn drop",
    notes: "Thank you for your business.",
    terms,
    shipping: "0",
    lines: [
      { itemId: "item_necklace", description: "22K Gold Necklace — Temple Set", quantity: 2, rate: 428000, taxPct: 3 },
      { itemId: "item_bangles", description: "Kundan Bridal Bangle Pair", quantity: 3, rate: 96000, taxPct: 3 },
      { itemId: "item_making", description: "Custom Making Charges", quantity: 1, rate: 18500, taxPct: 18 },
    ],
  });

  const inv2 = await saveTransaction(db, {
    organizationId: ORG,
    documentType: "invoice",
    status: "sent",
    contactId: "cust_royal",
    date: "2026-10-02",
    dueDate: "2026-10-17",
    paymentTermId: "term_15",
    salesperson: "Arjun Kapoor",
    subject: "Solitaire assortment",
    notes: "Please inspect stones under daylight.",
    terms,
    lines: [
      { itemId: "item_ring", description: "Solitaire Diamond Ring 0.50ct", quantity: 4, rate: 186000, taxPct: 3 },
      { itemId: "item_coin", description: "24K Gold Coin 10g", quantity: 6, rate: 78500, taxPct: 3 },
    ],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "invoice",
    status: "draft",
    contactId: "cust_meera",
    date: "2026-10-20",
    dueDate: "2026-10-20",
    paymentTermId: "term_due",
    salesperson: "Arjun Kapoor",
    subject: "Repair ticket #441",
    notes: "Awaiting customer confirmation on rhodium finish.",
    terms,
    lines: [{ itemId: "item_repair", description: "Jewellery Repair & Polish", quantity: 1, rate: 4500, taxPct: 18 }],
  });

  await recordPayment(db, {
    organizationId: ORG,
    paymentType: "received",
    contactId: "cust_nisha",
    date: "2026-10-05",
    amount: "500000",
    method: "neft",
    accountId: accId(ACCOUNT_CODES.bank),
    reference: "HDFC-NEFT-918822",
    allocations: [{ transactionId: inv1.id, amount: "500000" }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "quote",
    status: "sent",
    contactId: "cust_royal",
    date: "2026-10-14",
    dueDate: "2026-10-28",
    salesperson: "Arjun Kapoor",
    subject: "Diwali wholesale quote",
    notes: "Valid for 14 days.",
    terms,
    lines: [
      { itemId: "item_necklace", description: "22K Gold Necklace — Temple Set", quantity: 5, rate: 415000, taxPct: 3 },
      { itemId: "item_bangles", description: "Kundan Bridal Bangle Pair", quantity: 10, rate: 92000, taxPct: 3 },
    ],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "sales_order",
    status: "confirmed",
    contactId: "cust_nisha",
    date: "2026-10-16",
    dueDate: "2026-10-30",
    salesperson: "Arjun Kapoor",
    subject: "Lookbook replenishment",
    terms,
    lines: [{ itemId: "item_ring", description: "Solitaire Diamond Ring 0.50ct", quantity: 2, rate: 186000, taxPct: 3 }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "credit_note",
    status: "open",
    contactId: "cust_royal",
    date: "2026-10-10",
    subject: "Return — sizing issue",
    notes: "One ring returned. Credit may be applied to open invoices.",
    terms,
    lines: [{ itemId: "item_ring", description: "Solitaire Diamond Ring 0.50ct", quantity: 1, rate: 186000, taxPct: 3 }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "bill",
    status: "open",
    contactId: "vend_mmtc",
    date: "2026-10-01",
    dueDate: "2026-10-16",
    paymentTermId: "term_15",
    subject: "10g coin replenishment",
    notes: "Bullion lot #B-4412",
    lines: [{ itemId: "item_coin", description: "24K Gold Coin 10g", quantity: 25, rate: 76200, taxPct: 3, accountId: accId(ACCOUNT_CODES.inventory) }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "purchase_order",
    status: "issued",
    contactId: "vend_diamond",
    date: "2026-10-08",
    dueDate: "2026-10-22",
    subject: "VS1 melee refill",
    lines: [{ itemId: "item_ring", description: "Solitaire Diamond Ring 0.50ct (loose stones)", quantity: 6, rate: 118000, taxPct: 3 }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "expense",
    status: "paid",
    contactId: "vend_landlord",
    date: "2026-10-01",
    subject: "Showroom rent — October",
    expenseAccountId: accId(ACCOUNT_CODES.rent),
    paidThroughAccountId: accId(ACCOUNT_CODES.bank),
    lines: [{ description: "Zaveri Bazaar showroom rent", quantity: 1, rate: 185000, taxPct: 18 }],
  });

  await saveTransaction(db, {
    organizationId: ORG,
    documentType: "recurring_invoice",
    status: "active",
    contactId: "cust_nisha",
    date: "2026-10-01",
    recurrence: "monthly",
    subject: "Retainer — CAD studio",
    lines: [{ itemId: "item_making", description: "Monthly design retainer", quantity: 1, rate: 45000, taxPct: 18 }],
  });

  await db.insert(bankRules).values({
    id: nid(),
    organizationId: ORG,
    name: "HDFC bank charges",
    applyOn: "description",
    contains: "ACH CHARGE",
    categoryAccountId: accId(ACCOUNT_CODES.bankCharges),
  });

  await db.insert(bankTransactions).values([
    {
      id: nid(),
      organizationId: ORG,
      accountId: accId(ACCOUNT_CODES.bank),
      date: "2026-10-05",
      description: "NEFT IN Nisha Bridal House",
      payee: "Nisha Bridal House",
      reference: "HDFC-NEFT-918822",
      amount: "500000",
      status: "matched",
      matchedTransactionId: inv1.id,
    },
    {
      id: nid(),
      organizationId: ORG,
      accountId: accId(ACCOUNT_CODES.bank),
      date: "2026-10-01",
      description: "Zaveri Estate rent",
      payee: "Zaveri Estate Co.",
      amount: "-218300",
      status: "categorized",
      categoryAccountId: accId(ACCOUNT_CODES.rent),
    },
    {
      id: nid(),
      organizationId: ORG,
      accountId: accId(ACCOUNT_CODES.bank),
      date: "2026-10-12",
      description: "ACH CHARGE MAINTENANCE",
      payee: "HDFC Bank",
      amount: "-590",
      status: "unmatched",
    },
    {
      id: nid(),
      organizationId: ORG,
      accountId: accId(ACCOUNT_CODES.bank),
      date: "2026-10-18",
      description: "IMPS IN Royal Occasions",
      payee: "Royal Occasions",
      amount: "250000",
      status: "unmatched",
    },
    {
      id: nid(),
      organizationId: ORG,
      accountId: accId(ACCOUNT_CODES.bank),
      date: "2026-10-19",
      description: "UPI POS showroom",
      payee: "Meera Sethi",
      amount: "5310",
      status: "unmatched",
    },
  ]);

  void inv2;
}
