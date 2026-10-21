import { notFound } from "next/navigation";
import { reportsBundle } from "@/lib/queries";
import { formatINR, add } from "@/lib/money";
import { REPORTS } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = REPORTS.find((r) => r.slug === slug);
  if (!def) notFound();
  const data = await reportsBundle();
  const c = data.currency;

  return (
    <div className="sb-page mx-auto max-w-4xl">
      <div className="kpi-title">{def.group}</div>
      <h1 className="sb-h1">{def.name}</h1>
      <p className="sb-sub">
        {data.org?.name} · Base currency {c}
      </p>
      <div className="sb-card mt-6 p-5">
        {slug === "profit-and-loss" && <PL data={data} />}
        {slug === "balance-sheet" && <BS data={data} />}
        {slug === "cash-flow" && <CF data={data} />}
        {slug === "trial-balance" && <TB data={data} />}
        {slug === "general-ledger" && <TB data={data} />}
        {slug === "aged-receivables" && <Aging rows={data.invoices} buckets={data.arAging} />}
        {slug === "aged-payables" && <Aging rows={data.bills} buckets={data.apAging} />}
        {slug === "sales-by-customer" && <ByContact rows={data.invoices} />}
        {slug === "purchases-by-vendor" && <ByContact rows={data.bills} />}
      </div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Array<{ id: string; name: string; balance: string }> }) {
  const total = rows.reduce((s, r) => add(s, r.balance), "0");
  return (
    <div className="mb-4">
      <div className="kpi-title mb-1">{title}</div>
      {rows.map((r) => (
        <div key={r.id} className="flex justify-between py-0.5 text-[13px]">
          <span>{r.name}</span>
          <span className="money">{formatINR(r.balance)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t pt-1 text-[13px] font-semibold">
        <span>Total {title}</span>
        <span className="money">{formatINR(total)}</span>
      </div>
    </div>
  );
}

function PL({ data }: { data: Awaited<ReturnType<typeof reportsBundle>> }) {
  const income = data.income.reduce((s, r) => add(s, r.balance), "0");
  const expense = data.expense.reduce((s, r) => add(s, r.balance), "0");
  return (
    <>
      <Section title="Income" rows={data.income} />
      <Section title="Expenses" rows={data.expense} />
      <div className="flex justify-between text-[15px] font-semibold">
        <span>Net Profit</span>
        <span className="money">{formatINR(Number(income) - Number(expense))}</span>
      </div>
    </>
  );
}

function BS({ data }: { data: Awaited<ReturnType<typeof reportsBundle>> }) {
  return (
    <>
      <Section title="Assets" rows={data.assets} />
      <Section title="Liabilities" rows={data.liabilities} />
      <Section title="Equity" rows={data.equity} />
    </>
  );
}

function CF({ data }: { data: Awaited<ReturnType<typeof reportsBundle>> }) {
  const bank = data.assets.filter((a) => ["bank", "cash"].includes(a.accountType));
  return <Section title="Cash & Bank" rows={bank} />;
}

function TB({ data }: { data: Awaited<ReturnType<typeof reportsBundle>> }) {
  return (
    <table className="sb-table">
      <thead>
        <tr>
          <th>Account</th>
          <th className="num">Debit</th>
          <th className="num">Credit</th>
        </tr>
      </thead>
      <tbody>
        {data.balances.map((b) => (
          <tr key={b.id}>
            <td>
              {b.code} · {b.name}
            </td>
            <td className="num">{["asset", "expense"].includes(b.category) ? formatINR(b.balance) : ""}</td>
            <td className="num">{["liability", "equity", "income"].includes(b.category) ? formatINR(b.balance) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Aging({
  rows,
  buckets,
}: {
  rows: Awaited<ReturnType<typeof reportsBundle>>["invoices"];
  buckets: { current: string; d30: string; d60: string; d90: string; older: string };
}) {
  return (
    <>
      <div className="mb-4 grid grid-cols-5 gap-2 text-center text-[12px]">
        {Object.entries({ Current: buckets.current, "1-30": buckets.d30, "31-60": buckets.d60, "61-90": buckets.d90, "90+": buckets.older }).map(([k, v]) => (
          <div key={k} className="kpi p-2">
            <div className="text-slate-400">{k}</div>
            <div className="font-semibold money">{formatINR(v)}</div>
          </div>
        ))}
      </div>
      <table className="sb-table">
        <thead>
          <tr>
            <th>Contact</th>
            <th>Number</th>
            <th>Due</th>
            <th className="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .filter((r) => Number(r.txn.balance) > 0)
            .map((r) => (
              <tr key={r.txn.id}>
                <td>{r.contactName}</td>
                <td>{r.txn.number}</td>
                <td>{r.txn.dueDate}</td>
                <td className="num">{formatINR(r.txn.balance)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

function ByContact({ rows }: { rows: Awaited<ReturnType<typeof reportsBundle>>["invoices"] }) {
  const map = new Map<string, string>();
  for (const r of rows) {
    const k = r.contactName ?? "Unknown";
    map.set(k, add(map.get(k) ?? "0", r.txn.total));
  }
  return (
    <table className="sb-table">
      <tbody>
        {[...map.entries()].map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td className="num">{formatINR(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
