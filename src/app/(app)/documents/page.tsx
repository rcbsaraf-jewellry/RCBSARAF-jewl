import { PageHeader } from "@/components/ui";

export default function DocumentsPage() {
  return (
    <div className="sb-page">
      <PageHeader
        title="Documents"
        subtitle="Attach receipts, hallmark certificates, and vendor bills to expenses and inventory items."
      />
      <div className="sb-card p-10 text-center text-sm text-slate-400" style={{ borderStyle: "dashed" }}>
        Drop files onto a transaction to attach them. Storage is organization-scoped.
      </div>
    </div>
  );
}
