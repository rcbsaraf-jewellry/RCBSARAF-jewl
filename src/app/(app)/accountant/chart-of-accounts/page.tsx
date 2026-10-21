import { listAccounts } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import { saveAccount } from "@/server/actions";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ChartPage() {
  const rows = await listAccounts();
  const groups = ["asset", "liability", "equity", "income", "expense"] as const;
  return (
    <div className="sb-page">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Default books grouped as Assets, Liabilities, Equity, Income, and Expenses."
      />
      <form action={saveAccount} className="sb-card mb-5 grid grid-cols-6 gap-2 p-3">
        <input name="code" placeholder="Code" required className="sb-input" />
        <input name="name" placeholder="Account name" required className="sb-input" />
        <select name="category" className="sb-select">
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <input name="accountType" placeholder="Type" defaultValue="other_current_asset" className="sb-input" />
        <input name="description" placeholder="Description" className="sb-input" />
        <button className="sb-btn sb-btn-primary">+ New Account</button>
      </form>
      {groups.map((g) => (
        <div key={g} className="sb-table-wrap mb-4">
          <div className="bg-slate-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">{g}</div>
          <table className="sb-table">
            <tbody>
              {rows
                .filter((a) => a.category === g)
                .map((a) => (
                  <tr key={a.id}>
                    <td className="w-24 font-mono text-[12px] text-slate-500">{a.code}</td>
                    <td>
                      {a.name}
                      {a.isSystem && <span className="ml-2 text-[10px] uppercase text-slate-400">system</span>}
                    </td>
                    <td className="text-slate-500">{a.accountType.replaceAll("_", " ")}</td>
                    <td className="num font-medium">{formatINR(a.balance)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
