import Link from "next/link";
import { REPORTS } from "@/lib/nav";
import { PageHeader } from "@/components/ui";

export default function ReportsPage() {
  const groups = [...new Set(REPORTS.map((r) => r.group))];
  return (
    <div className="sb-page">
      <PageHeader title="Reports" subtitle="Business overview, accountant, receivables, payables, and sales reports." />
      <div className="reports-grid">
        {groups.map((g) => (
          <div key={g} className="sb-card p-4">
            <div className="kpi-title mb-2">{g}</div>
            {REPORTS.filter((r) => r.group === g).map((r) => (
              <Link key={r.slug} href={`/reports/${r.slug}`} className="sb-link block py-1.5 text-[13px]">
                {r.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
