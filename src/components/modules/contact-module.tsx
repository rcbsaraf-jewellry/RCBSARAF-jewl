import Link from "next/link";
import { Plus } from "lucide-react";
import { formatINR } from "@/lib/money";
import { getContact, listContacts } from "@/lib/queries";
import { StatusBadge } from "@/components/status-badge";
import { saveContact } from "@/server/actions";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { DOC_ROUTES } from "@/lib/routes";
import { EmptyState, PageHeader } from "@/components/ui";

export async function ContactModule({
  kind,
  id,
  mode,
}: {
  kind: "customer" | "vendor";
  id?: string;
  mode?: "new";
}) {
  const base = kind === "customer" ? "/sales/customers" : "/purchases/vendors";
  const title = kind === "customer" ? "Customers" : "Vendors";
  if (mode === "new") {
    return (
      <form action={saveContact} className="sb-page mx-auto max-w-3xl">
        <input type="hidden" name="contactType" value={kind} />
        <PageHeader
          title={`New ${kind}`}
          actions={
            <button className="sb-btn sb-btn-primary">Save</button>
          }
        />
        <div className="form-grid-2 sb-card p-5">
          <Field name="displayName" label="Display Name" required />
          <Field name="companyName" label="Company Name" />
          <Field name="email" label="Email" />
          <Field name="phone" label="Phone" />
          <Field name="gstin" label="GSTIN" />
          <Field name="currency" label="Currency" defaultValue="INR" />
          <Field name="billingStreet" label="Billing Street" className="span-2" />
          <Field name="billingCity" label="City" />
          <Field name="billingState" label="State" />
          <Field name="billingPostal" label="Postal Code" />
          <label className="span-2 flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="portalEnabled" /> Enable customer portal
          </label>
          <label className="span-2">
            <span className="sb-label">Notes</span>
            <textarea name="notes" rows={3} className="sb-textarea" />
          </label>
        </div>
      </form>
    );
  }

  const rows = await listContacts(kind);
  const selected = id ? await getContact(id) : rows[0] ? await getContact(rows[0].id) : { contact: null, persons: [], docs: [] };

  return (
    <div className="split">
      <section className="split-list">
        <div className="split-head">
          <h1>{title}</h1>
          <Link href={`${base}/new`} className="sb-btn sb-btn-primary sb-btn-sm">
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>
        <div className="sb-scroll flex-1 overflow-y-auto">
          {rows.map((c) => (
            <Link key={c.id} href={`${base}/${c.id}`} className={`row-link ${selected.contact?.id === c.id ? "is-active" : ""}`}>
              <div className="font-medium">{c.displayName}</div>
              <div className="text-[11px] text-slate-500">{c.email ?? c.phone ?? c.city}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="split-body sb-scroll">
        {!selected.contact ? (
          <EmptyState title={`Select a ${kind}`} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <h2 className="sb-h1">{selected.contact.displayName}</h2>
            <div className="sb-sub">
              {selected.contact.companyName} · {selected.contact.email} · {selected.contact.phone}
            </div>
            <div className="form-grid-2 sb-card mt-4 p-4 text-[13px]">
              <div>
                <div className="kpi-title">Billing</div>
                <div>{selected.contact.billingStreet}</div>
                <div>
                  {selected.contact.billingCity} {selected.contact.billingState} {selected.contact.billingPostal}
                </div>
                {selected.contact.gstin && <div>GSTIN {selected.contact.gstin}</div>}
              </div>
              <div>
                <div className="kpi-title">People</div>
                {selected.persons.map((p) => (
                  <div key={p.id}>
                    {p.name} · {p.designation} · {p.email}
                  </div>
                ))}
                <div className="mt-2">Credit limit {formatINR(selected.contact.creditLimit)}</div>
                {selected.contact.portalEnabled && <div className="text-emerald-700">Portal enabled</div>}
              </div>
            </div>
            <h3 className="mt-6 text-sm font-semibold">Transactions</h3>
            <div className="sb-table-wrap mt-2">
              <table className="sb-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Status</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.docs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.date}</td>
                      <td>{TYPE_META[d.documentType as DocumentType]?.label ?? d.documentType}</td>
                      <td>
                        <Link className="sb-link" href={`${DOC_ROUTES[d.documentType as DocumentType]}/${d.id}`}>
                          {d.number}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="num">{formatINR(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="sb-label">{label}</span>
      <input name={name} required={required} defaultValue={defaultValue} className="sb-input" />
    </label>
  );
}
