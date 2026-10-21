import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";
import { formatINR } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { approveQuotePortal } from "@/server/actions";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const session = await auth();
  const db = await getDb();
  const contactId = session?.user.contactId;
  const docs = contactId
    ? await db.select().from(transactions).where(eq(transactions.contactId, contactId))
    : [];
  const invoices = docs.filter((d) => d.documentType === "invoice");
  const quotes = docs.filter((d) => d.documentType === "quote");
  return (
    <div>
      <PageHeader
        title={`Welcome, ${session?.user.name}`}
        subtitle="Review quotes, track invoices, and follow outstanding balances."
      />
      <div className="form-grid-2">
        <section className="sb-card p-4">
          <h2 className="mb-2 font-semibold">Quotes</h2>
          {quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-[13px]">
              <div>
                <div className="font-medium">{q.number}</div>
                <div className="text-slate-500">{q.subject}</div>
              </div>
              <div className="text-right">
                <div className="money">{formatINR(q.total)}</div>
                <StatusBadge status={q.status} />
                {q.status === "sent" && (
                  <form action={approveQuotePortal.bind(null, q.id)}>
                    <button className="sb-btn sb-btn-ghost sb-btn-sm mt-1 text-emerald-700">Approve</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {quotes.length === 0 && <div className="text-[13px] text-slate-400">No quotes.</div>}
        </section>
        <section className="sb-card p-4">
          <h2 className="mb-2 font-semibold">Invoices</h2>
          {invoices.map((q) => (
            <div key={q.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-[13px]">
              <div>
                <div className="font-medium">{q.number}</div>
                <div className="text-slate-500">Due {q.dueDate}</div>
              </div>
              <div className="text-right">
                <div className="money">{formatINR(q.balance)} due</div>
                <StatusBadge status={q.status} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
