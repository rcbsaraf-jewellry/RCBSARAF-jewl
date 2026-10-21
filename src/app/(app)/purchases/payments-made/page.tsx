import { listPayments } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await listPayments("made");
  return (
    <div className="sb-page">
      <PageHeader title="Payments Made" />
      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Number</th>
              <th>Vendor</th>
              <th>Method</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.payment.id}>
                <td>{r.payment.date}</td>
                <td>{r.payment.number}</td>
                <td>{r.contactName}</td>
                <td className="uppercase">{r.payment.method}</td>
                <td className="num">{formatINR(r.payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
