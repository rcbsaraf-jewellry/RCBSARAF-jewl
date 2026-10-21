import type { LucideIcon } from "lucide-react";
import { hasFullAppAccess, ROLE_ALLOWED_PREFIXES } from "@/lib/app-access";
import {
  Banknote,
  BookOpen,
  Briefcase,
  ClipboardList,
  FileText,
  FolderOpen,
  Home,
  Landmark,
  LayoutDashboard,
  Package,
  PieChart,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";

export type NavChild = { href: string; label: string };
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavChild[];
};

export const APP_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/items", label: "Items", icon: Package },
  { href: "/banking", label: "Banking", icon: Landmark },
  {
    href: "/sales/invoices",
    label: "Sales",
    icon: Receipt,
    children: [
      { href: "/sales/customers", label: "Customers" },
      { href: "/sales/quotes", label: "Quotes" },
      { href: "/sales/sales-orders", label: "Sales Orders" },
      { href: "/sales/delivery-challans", label: "Delivery Challans" },
      { href: "/sales/invoices", label: "Invoices" },
      { href: "/sales/recurring-invoices", label: "Recurring Invoices" },
      { href: "/sales/retainer-invoices", label: "Retainer Invoices" },
      { href: "/sales/payments-received", label: "Payments Received" },
      { href: "/sales/credit-notes", label: "Credit Notes" },
    ],
  },
  {
    href: "/purchases/bills",
    label: "Purchases",
    icon: ShoppingBag,
    children: [
      { href: "/purchases/vendors", label: "Vendors" },
      { href: "/purchases/expenses", label: "Expenses" },
      { href: "/purchases/recurring-bills", label: "Recurring Bills" },
      { href: "/purchases/mileage", label: "Mileage" },
      { href: "/purchases/purchase-orders", label: "Purchase Orders" },
      { href: "/purchases/bills", label: "Bills" },
      { href: "/purchases/payments-made", label: "Payments Made" },
      { href: "/purchases/vendor-credits", label: "Vendor Credits" },
    ],
  },
  {
    href: "/time/timesheet",
    label: "Time Tracking",
    icon: Briefcase,
    children: [
      { href: "/time/projects", label: "Projects" },
      { href: "/time/timesheet", label: "Timesheet" },
    ],
  },
  {
    href: "/accountant/chart-of-accounts",
    label: "Accountant",
    icon: BookOpen,
    children: [
      { href: "/accountant/journals", label: "Manual Journals" },
      { href: "/accountant/chart-of-accounts", label: "Chart of Accounts" },
    ],
  },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/documents", label: "Documents", icon: FolderOpen },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export const QUICK_CREATE = [
  { href: "/sales/invoices/new", label: "Invoice", icon: FileText },
  { href: "/sales/quotes/new", label: "Quote", icon: ClipboardList },
  { href: "/purchases/bills/new", label: "Bill", icon: Receipt },
  { href: "/purchases/expenses/new", label: "Expense", icon: Banknote },
  { href: "/sales/customers/new", label: "Customer", icon: Users },
  { href: "/accountant/journals/new", label: "Journal", icon: BookOpen },
];

function matchesAllowedPath(href: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
}

export function navForRole(role?: string | null): NavItem[] {
  if (!role || hasFullAppAccess(role)) return APP_NAV;
  const prefixes = ROLE_ALLOWED_PREFIXES[role];
  if (!prefixes) return [];
  return APP_NAV.filter((item) => matchesAllowedPath(item.href, prefixes));
}

export function bottomNavForRole(role?: string | null): NavItem[] {
  if (!role || hasFullAppAccess(role)) return BOTTOM_NAV;
  return [];
}

export function quickCreateForRole(role?: string | null) {
  if (!role || hasFullAppAccess(role)) return QUICK_CREATE;
  const prefixes = ROLE_ALLOWED_PREFIXES[role];
  if (!prefixes) return [];
  return [
    ...(prefixes.includes("/items") ? [{ href: "/items/new", label: "Item", icon: Package }] : []),
    ...QUICK_CREATE.filter((item) => matchesAllowedPath(item.href, prefixes)),
  ];
}

export const REPORTS = [
  { slug: "profit-and-loss", name: "Profit and Loss", group: "Business Overview" },
  { slug: "balance-sheet", name: "Balance Sheet", group: "Business Overview" },
  { slug: "cash-flow", name: "Cash Flow Statement", group: "Business Overview" },
  { slug: "trial-balance", name: "Trial Balance", group: "Accountant" },
  { slug: "general-ledger", name: "General Ledger", group: "Accountant" },
  { slug: "aged-receivables", name: "Aged Receivables", group: "Receivables" },
  { slug: "aged-payables", name: "Aged Payables", group: "Payables" },
  { slug: "sales-by-customer", name: "Sales by Customer", group: "Sales" },
  { slug: "purchases-by-vendor", name: "Purchases by Vendor", group: "Purchases" },
];

export { LayoutDashboard };
