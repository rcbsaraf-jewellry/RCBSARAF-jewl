import Link from "next/link";
import { listItems } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const rows = await listItems();
  return (
    <div className="sb-page">
      <PageHeader
        title="Items"
        subtitle="Goods, services, and jewellery SKUs"
        actions={
          <Link href="/items/new" className="sb-btn sb-btn-primary">
            + New
          </Link>
        }
      />
      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Type</th>
              <th className="num">Rate</th>
              <th className="num">Purchase</th>
              <th className="num">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/items/${item.id}`} className="sb-link">
                    {item.name}
                  </Link>
                  <div className="text-[11px] text-slate-400">{item.hsn ? `HSN ${item.hsn}` : item.unit}</div>
                </td>
                <td>{item.sku}</td>
                <td className="capitalize">{item.itemType}</td>
                <td className="num">{formatINR(item.saleRate)}</td>
                <td className="num">{formatINR(item.purchaseRate)}</td>
                <td className="num">{item.trackInventory ? Number(item.stockOnHand) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
