import type { DocumentType } from "@/lib/catalog";

export const DOC_ROUTES: Record<DocumentType, string> = {
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

export const FILTERS: Partial<Record<DocumentType, string[]>> = {
  invoice: ["all", "draft", "sent", "overdue", "partially_paid", "paid", "void"],
  quote: ["all", "draft", "sent", "accepted", "declined", "invoiced"],
  sales_order: ["all", "draft", "confirmed", "closed"],
  bill: ["all", "draft", "open", "overdue", "partially_paid", "paid"],
  expense: ["all", "draft", "paid"],
  credit_note: ["all", "draft", "open", "closed"],
};
