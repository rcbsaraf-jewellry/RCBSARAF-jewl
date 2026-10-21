import Link from "next/link";
import { dashboardData } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { DOC_ROUTES } from "@/lib/routes";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const d = await dashboardData();
  return (
    <div className="sb-page">
      <PageHeader title="Dashboard" subtitle={`${d.org?.name} · FY starts April · ${d.currency}`} />
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-title">Total Receivables</div>
          <div className="kpi-value">{d.format(d.receivables.total)}</div>
          <Split a="Current" av={d.format(d.receivables.current)} b="Overdue" bv={d.format(d.receivables.overdue)} />
        </div>
        <div className="kpi">
          <div className="kpi-title">Total Payables</div>
          <div className="kpi-value">{d.format(d.payables.total)}</div>
          <Split a="Current" av={d.format(d.payables.current)} b="Overdue" bv={d.format(d.payables.overdue)} />
        </div>
        <div className="kpi">
          <div className="kpi-title">Cash in Hand & Bank</div>
          <div className="kpi-value">
            {d.format(d.cashAccounts.reduce((s, a) => (Number(s) + Number(a.balance)).toFixed(2), "0"))}
          </div>
          <div className="mt-3 space-y-1">
            {d.cashAccounts.map((a) => (
              <div key={a.id} className="flex justify-between text-[12px] text-slate-500">
                <span>{a.name}</span>
                <span className="money">{d.format(a.balance)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Income vs Expense</div>
          <div className="kpi-value">{d.format(d.profit)}</div>
          <Split a="Income" av={d.format(d.income)} b="Expense" bv={d.format(d.expense)} />
        </div>
      </div>

      <div className="dash-grid">
        <div className="sb-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <Link href="/sales/invoices" className="sb-link text-[12px]">
              View all
            </Link>
          </div>
          <table className="sb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Number</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {d.recent.map((r) => {
                const type = r.txn.documentType as DocumentType;
                return (
                  <tr key={r.txn.id}>
                    <td>{r.txn.date}</td>
                    <td>{TYPE_META[type]?.label ?? type}</td>
                    <td>{r.contactName}</td>
                    <td>
                      <Link className="sb-link" href={`${DOC_ROUTES[type] ?? "/home"}/${r.txn.id}`}>
                        {r.txn.number}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={r.txn.status} />
                    </td>
                    <td className="num">{formatINR(r.txn.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sb-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Top Expenses</h2>
          {d.topExpenses.map((e) => (
            <div key={e.id} className="mb-2">
              <div className="flex justify-between text-[12px]">
                <span>{e.name}</span>
                <span className="font-medium money">{d.format(e.balance)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full bg-[var(--gold)]"
                  style={{
                    width: `${Math.min(100, (Number(e.balance) / Math.max(1, Number(d.topExpenses[0]?.balance))) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="mt-5 border-t border-slate-100 pt-3">
            <h2 className="mb-2 text-sm font-semibold">Projects</h2>
            <div className="text-[12px] text-slate-500">Unbilled hours</div>
            <div className="text-lg font-semibold">{Number(d.unbilledHours)} hrs</div>
            {d.projects.map((p) => (
              <div key={p.id} className="mt-1 text-[12px]">
                {p.name} · <span className="capitalize text-slate-500">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Split({ a, av, b, bv }: { a: string; av: string; b: string; bv: string }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
      <div>
        <div className="text-slate-400">{a}</div>
        <div className="font-medium money">{av}</div>
      </div>
      <div>
        <div className="text-slate-400">{b}</div>
        <div className="font-medium money text-rose-700">{bv}</div>
      </div>
    </div>
  );
}
