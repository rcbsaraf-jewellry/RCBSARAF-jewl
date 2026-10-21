"use client";

import { useState } from "react";
import { saveManualJournal } from "@/server/actions";
import { todayISO } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

export default function NewJournalPage() {
  const [lines, setLines] = useState([
    { accountId: "acc_6000", debit: "0", credit: "0", description: "" },
    { accountId: "acc_1010", debit: "0", credit: "0", description: "" },
  ]);
  return (
    <form action={saveManualJournal} className="sb-page mx-auto max-w-3xl">
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      <PageHeader title="New Journal" actions={<button className="sb-btn sb-btn-primary">Publish</button>} />
      <div className="sb-card p-4">
        <label>
          <span className="sb-label">Date</span>
          <input name="date" type="date" defaultValue={todayISO()} className="sb-input" />
        </label>
        <label className="mt-3 block">
          <span className="sb-label">Notes</span>
          <input name="notes" className="sb-input" />
        </label>
        <div className="sb-table-wrap mt-4">
          <table className="sb-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={l.accountId}
                      onChange={(e) => setLines((rows) => rows.map((r, idx) => (idx === i ? { ...r, accountId: e.target.value } : r)))}
                      className="sb-input"
                    />
                  </td>
                  <td>
                    <input
                      value={l.debit}
                      onChange={(e) => setLines((rows) => rows.map((r, idx) => (idx === i ? { ...r, debit: e.target.value } : r)))}
                      className="sb-input w-28"
                    />
                  </td>
                  <td>
                    <input
                      value={l.credit}
                      onChange={(e) => setLines((rows) => rows.map((r, idx) => (idx === i ? { ...r, credit: e.target.value } : r)))}
                      className="sb-input w-28"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setLines((r) => [...r, { accountId: "", debit: "0", credit: "0", description: "" }])}
          className="sb-btn sb-btn-ghost mt-2"
        >
          + Add line
        </button>
      </div>
    </form>
  );
}
