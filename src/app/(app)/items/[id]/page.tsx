import { notFound } from "next/navigation";
import { getItem } from "@/lib/queries";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  return (
    <div className="sb-page mx-auto max-w-3xl">
      <div className="kpi-title">{item.itemType}</div>
      <h1 className="sb-h1">{item.name}</h1>
      <p className="sb-sub">
        SKU {item.sku} · HSN {item.hsn}
      </p>
      <div className="kpi-grid mt-5" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <Stat label="Selling price" value={formatINR(item.saleRate)} />
        <Stat label="Purchase price" value={formatINR(item.purchaseRate)} />
        <Stat label="Stock on hand" value={item.trackInventory ? String(Number(item.stockOnHand)) : "Not tracked"} />
      </div>
      {item.description && <p className="mt-4 text-[13px] text-slate-600">{item.description}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="kpi-title">{label}</div>
      <div className="kpi-value" style={{ fontSize: 18 }}>
        {value}
      </div>
    </div>
  );
}
