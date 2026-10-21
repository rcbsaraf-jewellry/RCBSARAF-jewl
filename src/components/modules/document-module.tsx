import Link from "next/link";
import { Plus } from "lucide-react";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { formLookups, getTransaction, listTransactions } from "@/lib/queries";
import { DOC_ROUTES, FILTERS } from "@/lib/routes";
import { StatusBadge } from "@/components/status-badge";
import { DocumentForm } from "@/components/document-form";
import { recordPaymentAction } from "@/server/actions";
import { todayISO } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

export async function DocumentModule({
  type,
  id,
  mode,
  status = "all",
}: {
  type: DocumentType;
  id?: string;
  mode?: "new" | "list" | "detail";
  status?: string;
}) {
  const meta = TYPE_META[type];
  const base = DOC_ROUTES[type];
  if (mode === "new") {
    const lookups = await formLookups();
    return (
      <DocumentForm
        type={type}
        contacts={meta.contact === "customer" ? lookups.customers : lookups.vendors}
        items={lookups.items}
        taxes={lookups.taxes}
        accounts={lookups.accounts}
      />
    );
  }

  const rows = await listTransactions(type, { status });
  const selected = id ? await getTransaction(id) : rows[0] ? await getTransaction(rows[0].txn.id) : null;
  const filters = FILTERS[type] ?? ["all", "draft", "sent", "paid"];

  return (
    <div className="split">
      <section className="split-list">
        <div className="split-head">
          <h1>{meta.plural}</h1>
          <Link href={`${base}/new`} className="sb-btn sb-btn-primary sb-btn-sm">
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>
        <div className="split-filters">
          {filters.map((f) => (
            <Link key={f} href={`${base}?status=${f}`} className={`filter-chip ${status === f ? "is-active" : ""}`}>
              {f.replaceAll("_", " ")}
            </Link>
          ))}
        </div>
        <div className="sb-scroll flex-1 overflow-y-auto">
          {rows.map((row) => {
            const active = selected?.txn.id === row.txn.id;
            return (
              <Link key={row.txn.id} href={`${base}/${row.txn.id}`} className={`row-link ${active ? "is-active" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-medium">{row.contactName ?? "No contact"}</div>
                    <div className="text-[11px] text-slate-500">
                      {row.txn.number} · {row.txn.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold money">{formatINR(row.txn.total)}</div>
                    <StatusBadge status={row.txn.status} />
                  </div>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <EmptyState title={`No ${meta.plural.toLowerCase()} yet`} hint="Create a record from the New button." />
          )}
        </div>
      </section>
      <section className="split-body sb-scroll">
        {!selected?.txn ? <EmptyState title="Select a record" /> : <DocumentDetail type={type} selected={selected} />}
      </section>
    </div>
  );
}

function DocumentDetail({
  type,
  selected,
}: {
  type: DocumentType;
  selected: NonNullable<Awaited<ReturnType<typeof getTransaction>>>;
}) {
  const { txn, lines, contact, journal } = selected;
  const meta = TYPE_META[type];
  const showPay = ["invoice", "bill", "retainer_invoice"].includes(type) && !["paid", "draft", "void"].includes(txn.status);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="page-head">
        <div>
          <div className="text-[12px] text-slate-500">{meta.label}</div>
          <h2 className="sb-h1">{txn.number}</h2>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={txn.status} />
            <span className="text-[12px] text-slate-500">{txn.date}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="kpi-title">Balance Due</div>
          <div className="kpi-value">{formatINR(txn.balance)}</div>
        </div>
      </div>

      <div className="form-grid-2 sb-card p-5">
        <div>
          <div className="kpi-title">{meta.contact}</div>
          <div className="mt-1 font-medium">{contact?.displayName}</div>
          <div className="text-[12px] text-slate-500">
            {contact?.billingStreet}
            {contact?.billingCity ? `, ${contact.billingCity}` : ""}
            {contact?.billingState ? `, ${contact.billingState}` : ""}
          </div>
          <div className="text-[12px] text-slate-500">{contact?.email}</div>
          {contact?.gstin && <div className="text-[12px] text-slate-500">GSTIN {contact.gstin}</div>}
        </div>
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <Meta label="Reference" value={txn.reference} />
          <Meta label="Due date" value={txn.dueDate} />
          <Meta label="Salesperson" value={txn.salesperson} />
          <Meta label="Subject" value={txn.subject} />
        </div>
      </div>

      <div className="sb-table-wrap mt-4">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Item & Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Tax</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td>
                  <div className="font-medium">{line.description}</div>
                </td>
                <td>{Number(line.quantity)}</td>
                <td className="money">{formatINR(line.rate)}</td>
                <td>{Number(line.taxPct)}%</td>
                <td className="num">{formatINR(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sb-card ml-auto mt-3 w-72 p-4 text-[13px]">
        <Info label="Sub Total" value={formatINR(txn.subTotal)} />
        <Info label="Discount" value={formatINR(txn.discountTotal)} />
        <Info label="Tax" value={formatINR(txn.taxTotal)} />
        <Info label="Shipping" value={formatINR(txn.shipping)} />
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold">
          <span>Total</span>
          <span className="money">{formatINR(txn.total)}</span>
        </div>
        <Info label="Paid" value={formatINR(txn.paid)} />
        <div className="flex justify-between font-semibold text-amber-800">
          <span>Balance Due</span>
          <span className="money">{formatINR(txn.balance)}</span>
        </div>
      </div>

      {txn.notes && (
        <div className="mt-4 text-[13px]">
          <div className="kpi-title">Notes</div>
          {txn.notes}
        </div>
      )}

      {showPay && (
        <form action={recordPaymentAction} className="sb-card mt-6 p-4">
          <div className="text-sm font-semibold">Record Payment</div>
          <input type="hidden" name="paymentType" value={meta.group === "sales" ? "received" : "made"} />
          <input type="hidden" name="contactId" value={txn.contactId ?? ""} />
          <input type="hidden" name="transactionId" value={txn.id} />
          <input type="hidden" name="redirectTo" value={`${DOC_ROUTES[type]}/${txn.id}`} />
          <div className="mt-3 grid grid-cols-4 gap-3">
            <input name="date" type="date" defaultValue={todayISO()} className="sb-input" />
            <input name="amount" defaultValue={txn.balance} className="sb-input" />
            <select name="method" className="sb-select">
              <option value="neft">NEFT / IMPS</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
            <input name="reference" placeholder="Reference" className="sb-input" />
          </div>
          <button className="sb-btn sb-btn-primary mt-3">Record Payment</button>
        </form>
      )}

      {journal.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold">Journal</div>
          <div className="sb-table-wrap mt-2">
            <table className="sb-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="num">Debit</th>
                  <th className="num">Credit</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((j) => (
                  <tr key={j.line.id}>
                    <td>
                      {j.accountCode} · {j.accountName}
                    </td>
                    <td className="num">{Number(j.line.debit) ? formatINR(j.line.debit) : ""}</td>
                    <td className="num">{Number(j.line.credit) ? formatINR(j.line.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="money">{value}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
