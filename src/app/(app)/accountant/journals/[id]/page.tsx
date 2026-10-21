import { notFound } from "next/navigation";
import { getJournal } from "@/lib/queries";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { journal, lines } = await getJournal(id);
  if (!journal) notFound();
  return (
    <div className="sb-page mx-auto max-w-3xl">
      <h1 className="sb-h1">{journal.number}</h1>
      <p className="sb-sub">
        {journal.date} · {journal.notes}
      </p>
      <div className="sb-table-wrap mt-4">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Account</th>
              <th className="num">Debit</th>
              <th className="num">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.line.id}>
                <td>
                  {l.accountCode} · {l.accountName}
                  <div className="text-[11px] text-slate-400">{l.line.description}</div>
                </td>
                <td className="num">{Number(l.line.debit) ? formatINR(l.line.debit) : ""}</td>
                <td className="num">{Number(l.line.credit) ? formatINR(l.line.credit) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
