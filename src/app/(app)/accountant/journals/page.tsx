import Link from "next/link";
import { listJournals } from "@/lib/queries";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function JournalsPage() {
  const rows = await listJournals();
  return (
    <div className="sb-page">
      <PageHeader
        title="Manual Journals"
        actions={
          <Link href="/accountant/journals/new" className="sb-btn sb-btn-primary">
            + New
          </Link>
        }
      />
      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Number</th>
              <th>Notes</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id}>
                <td>{j.date}</td>
                <td>
                  <Link href={`/accountant/journals/${j.id}`} className="sb-link">
                    {j.number}
                  </Link>
                </td>
                <td>{j.notes}</td>
                <td className="capitalize">{j.sourceType.replaceAll("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
