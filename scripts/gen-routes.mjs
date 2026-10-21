import fs from "node:fs";
import path from "node:path";

const modules = [
  ["quote", "sales/quotes"],
  ["sales_order", "sales/sales-orders"],
  ["delivery_challan", "sales/delivery-challans"],
  ["recurring_invoice", "sales/recurring-invoices"],
  ["retainer_invoice", "sales/retainer-invoices"],
  ["credit_note", "sales/credit-notes"],
  ["bill", "purchases/bills"],
  ["purchase_order", "purchases/purchase-orders"],
  ["recurring_bill", "purchases/recurring-bills"],
  ["vendor_credit", "purchases/vendor-credits"],
  ["expense", "purchases/expenses"],
  ["mileage", "purchases/mileage"],
];

const root = "src/app/(app)";

for (const [type, p] of modules) {
  const dir = path.join(root, p, "[id]");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "page.tsx"),
    `import { DocumentModule } from "@/components/modules/document-module";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentModule type="${type}" id={id} />;
}
`,
  );
}

console.log("id pages written");
