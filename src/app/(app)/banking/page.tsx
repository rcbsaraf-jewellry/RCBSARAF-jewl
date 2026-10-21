import Link from "next/link";
import { listAccounts, listBank, listTransactions } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { categorizeBank, matchBank } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function BankingPage({
  searchParams,
}: {
  searchParams: Promise<{ accountId?: string }>;
}) {
  const { accountId } = await searchParams;
  const { bankAccounts, selected, txns } = await listBank(accountId);
  const accounts = await listAccounts();
  const expenseAccounts = accounts.filter((a) => a.category === "expense" || a.category === "income");
  const invoices = await listTransactions("invoice");
  const current = bankAccounts.find((a) => a.id === selected);

  return (
    <div className="split">
      <aside className="split-list" style={{ width: 260 }}>
        <div className="split-head">
          <h1>Banking</h1>
        </div>
        <div className="p-2">
          {bankAccounts.map((a) => (
            <Link
              key={a.id}
              href={`/banking?accountId=${a.id}`}
              className={`account-pill ${a.id === selected ? "is-active" : ""}`}
            >
              <div className="text-[13px] font-medium">{a.name}</div>
              <div className="text-[12px] text-slate-500 money">{formatINR(a.balance)}</div>
            </Link>
          ))}
        </div>
      </aside>
      <section className="split-body">
        <div className="page-head">
          <div>
            <h2 className="sb-h1">{current?.name ?? "Select an account"}</h2>
            <p className="sb-sub">Match imported feeds or categorize them into the ledger.</p>
          </div>
          <div className="text-right">
            <div className="kpi-title">Book balance</div>
            <div className="kpi-value">{formatINR(current?.balance ?? "0")}</div>
          </div>
        </div>
        <div className="sb-table-wrap">
          <table className="sb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-[11px] text-slate-400">
                      {t.payee} {t.reference}
                    </div>
                  </td>
                  <td className={`num ${Number(t.amount) < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {formatINR(t.amount)}
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>
                    {t.status === "unmatched" && (
                      <div className="flex flex-col gap-1">
                        <form action={categorizeBank} className="flex gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <select name="categoryAccountId" className="sb-select h-7 text-[12px]">
                            {expenseAccounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                          <button className="sb-btn sb-btn-primary sb-btn-sm">Categorize</button>
                        </form>
                        <form action={matchBank} className="flex gap-1">
                          <input type="hidden" name="id" value={t.id} />
                          <select name="matchedTransactionId" className="sb-select h-7 text-[12px]">
                            {invoices.map((i) => (
                              <option key={i.txn.id} value={i.txn.id}>
                                {i.txn.number} · {i.contactName}
                              </option>
                            ))}
                          </select>
                          <button className="sb-btn sb-btn-secondary sb-btn-sm">Match</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
