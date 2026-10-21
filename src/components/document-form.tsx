"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TYPE_META, type DocumentType } from "@/lib/catalog";
import { documentTotals, formatINR, lineTotals } from "@/lib/money";
import { saveDocument } from "@/server/actions";
import { todayISO } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

type Item = {
  id: string;
  name: string;
  saleRate: string;
  purchaseRate: string;
  taxId: string | null;
  description: string | null;
};
type Contact = { id: string; displayName: string };
type Tax = { id: string; name: string; rate: string };
type Account = { id: string; name: string; code: string; category: string; accountType?: string | null };

type Line = {
  itemId: string;
  description: string;
  accountId: string;
  quantity: string;
  rate: string;
  discountPct: string;
  taxId: string;
  taxPct: string;
};

const emptyLine = (): Line => ({
  itemId: "",
  description: "",
  accountId: "",
  quantity: "1",
  rate: "0",
  discountPct: "0",
  taxId: "",
  taxPct: "0",
});

export function DocumentForm({
  type,
  contacts,
  items,
  taxes,
  accounts,
  defaultStatus = "sent",
}: {
  type: DocumentType;
  contacts: Contact[];
  items: Item[];
  taxes: Tax[];
  accounts: Account[];
  defaultStatus?: string;
}) {
  const meta = TYPE_META[type];
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [shipping, setShipping] = useState("0");
  const [adjustment, setAdjustment] = useState("0");
  const totals = useMemo(
    () => documentTotals({ lines, shipping, adjustment }),
    [lines, shipping, adjustment],
  );

  function patch(i: number, next: Partial<Line>) {
    setLines((rows) =>
      rows.map((row, idx) => {
        if (idx !== i) return row;
        const merged = { ...row, ...next };
        if (next.itemId) {
          const item = items.find((it) => it.id === next.itemId);
          if (item) {
            merged.description = item.description ?? item.name;
            merged.rate = meta.group === "purchases" ? item.purchaseRate : item.saleRate;
            const tax = taxes.find((t) => t.id === item.taxId);
            if (tax) {
              merged.taxId = tax.id;
              merged.taxPct = tax.rate;
            }
          }
        }
        if (next.taxId) {
          const tax = taxes.find((t) => t.id === next.taxId);
          if (tax) merged.taxPct = tax.rate;
        }
        return merged;
      }),
    );
  }

  return (
    <form action={saveDocument} className="sb-page mx-auto max-w-[1100px]">
      <input type="hidden" name="documentType" value={type} />
      <input type="hidden" name="status" value={defaultStatus} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines.filter((l) => Number(l.quantity) && (Number(l.rate) || l.description)))} />
      <PageHeader
        title={`New ${meta.label}`}
        actions={
          <>
            <button name="intent" value="draft" className="sb-btn sb-btn-secondary">
              Save as Draft
            </button>
            <button name="intent" value="send" className="sb-btn sb-btn-primary">
              Save and Send
            </button>
          </>
        }
      />
      <div className="sb-card p-5">
        <div className="form-grid-3">
          <label>
            <span className="sb-label">{meta.contact === "customer" ? "Customer Name" : "Vendor Name"}*</span>
            <select name="contactId" required className="sb-select">
              <option value="">Select</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sb-label">{meta.label} Date*</span>
            <input name="date" type="date" defaultValue={todayISO()} className="sb-input" />
          </label>
          <label>
            <span className="sb-label">Due Date</span>
            <input name="dueDate" type="date" className="sb-input" />
          </label>
          <label>
            <span className="sb-label">Order Number</span>
            <input name="reference" className="sb-input" />
          </label>
          <label>
            <span className="sb-label">Salesperson</span>
            <input name="salesperson" defaultValue="Arjun Kapoor" className="sb-input" />
          </label>
          <label className="span-3">
            <span className="sb-label">Subject</span>
            <input name="subject" className="sb-input" />
          </label>
        </div>

        <div className="sb-table-wrap mt-6">
          <table className="sb-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Discount %</th>
                <th>Tax</th>
                <th className="num">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const lt = lineTotals(line);
                return (
                  <tr key={i}>
                    <td>
                      <select
                        value={line.itemId}
                        onChange={(e) => patch(i, { itemId: e.target.value })}
                        className="sb-select"
                      >
                        <option value="">Select item</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={line.description}
                        onChange={(e) => patch(i, { description: e.target.value })}
                        placeholder="Description"
                        className="sb-input mt-1 h-7 text-[11px]"
                      />
                    </td>
                    <td>
                      <input value={line.quantity} onChange={(e) => patch(i, { quantity: e.target.value })} className="sb-input w-20" />
                    </td>
                    <td>
                      <input value={line.rate} onChange={(e) => patch(i, { rate: e.target.value })} className="sb-input w-28" />
                    </td>
                    <td>
                      <input value={line.discountPct} onChange={(e) => patch(i, { discountPct: e.target.value })} className="sb-input w-16" />
                    </td>
                    <td>
                      <select value={line.taxId} onChange={(e) => patch(i, { taxId: e.target.value })} className="sb-select">
                        <option value="">No tax</option>
                        {taxes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num font-medium">{formatINR(lt.amount)}</td>
                    <td>
                      <button type="button" onClick={() => setLines((rows) => rows.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setLines((rows) => [...rows, emptyLine()])} className="sb-btn sb-btn-ghost mt-2">
          <Plus className="h-3.5 w-3.5" /> Add New Row
        </button>

        {(type === "expense" || type === "mileage") && (
          <div className="form-grid-2 mt-4">
            <label>
              <span className="sb-label">Expense Account</span>
              <select name="expenseAccountId" className="sb-select">
                {accounts.filter((a) => a.category === "expense").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sb-label">Paid Through</span>
              <select name="paidThroughAccountId" className="sb-select">
                {accounts.filter((a) => ["bank", "cash", "credit_card"].includes(a.accountType ?? "")).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="form-grid-2 mt-6">
          <div>
            <label className="block">
              <span className="sb-label">Customer Notes</span>
              <textarea name="notes" rows={3} className="sb-textarea" defaultValue="Thank you for your business." />
            </label>
            <label className="mt-3 block">
              <span className="sb-label">Terms & Conditions</span>
              <textarea name="terms" rows={3} className="sb-textarea" />
            </label>
          </div>
          <div className="ml-auto w-80 text-[13px]">
            <Row label="Sub Total" value={formatINR(totals.subTotal)} />
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Shipping charges</span>
              <input value={shipping} onChange={(e) => setShipping(e.target.value)} name="shipping" className="sb-input h-7 w-28 text-right" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Adjustment</span>
              <input value={adjustment} onChange={(e) => setAdjustment(e.target.value)} name="adjustment" className="sb-input h-7 w-28 text-right" />
            </div>
            <Row label="Discount" value={formatINR(totals.discountTotal)} />
            <Row label="Tax" value={formatINR(totals.taxTotal)} />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-[15px] font-semibold">
              <span>Total</span>
              <span className="money">{formatINR(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-500">{label}</span>
      <span className="money">{value}</span>
    </div>
  );
}
