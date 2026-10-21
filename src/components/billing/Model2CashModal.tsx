"use client";

import type { BillSummary } from "@/lib/billing/types";
import { formatINR, m } from "@/lib/money";
import { X } from "lucide-react";

const DENOMS = ["100", "200", "500", "2000"];

export function Model2CashModal({
  open,
  summary,
  cashReceived,
  busy,
  error,
  onCashReceived,
  onClose,
  onConfirm,
}: {
  open: boolean;
  summary: BillSummary;
  cashReceived: string;
  busy?: boolean;
  error?: string | null;
  onCashReceived: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  function addDenom(value: string) {
    onCashReceived(m(cashReceived).plus(m(value)).toFixed(2));
  }

  return (
    <div className="billing-no-print fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Model 2</div>
            <h3 className="text-lg font-semibold">Tender cash</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-[#1c1917] p-4 text-[#f8efd4]">
          <div className="text-xs uppercase tracking-[0.16em] text-[#c9a227]">Amount due</div>
          <div className="mt-1 text-3xl font-semibold">{formatINR(summary.payableAmount)}</div>
        </div>
        <label className="mt-4 block text-sm">
          Cash received
          <input
            autoFocus
            inputMode="decimal"
            value={cashReceived}
            onChange={(e) => onCashReceived(e.target.value.replace(/[^\d.]/g, ""))}
            className="mt-1 w-full rounded-md border border-[#e7e1d8] px-3 py-2 text-lg font-semibold"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onCashReceived(summary.payableAmount)} className="rounded-md border border-[#c9a227] bg-[#f8efd4] px-3 py-1.5 text-sm font-semibold">
            Exact
          </button>
          {DENOMS.map((d) => (
            <button key={d} type="button" onClick={() => addDenom(d)} className="rounded-md border border-[#e7e1d8] px-3 py-1.5 text-sm">
              +₹{d}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#f4f1ea] px-3 py-3 text-sm">
          <span>Change due</span>
          <span className="text-lg font-semibold">{formatINR(summary.changeDue)}</span>
        </div>
        {(error || summary.tenderError) && <p className="mt-3 text-sm text-rose-700">{error || summary.tenderError}</p>}
        <button
          type="button"
          disabled={busy || !summary.tenderValid}
          onClick={onConfirm}
          className="mt-4 w-full rounded-md bg-[#c9a227] py-2.5 text-sm font-semibold text-[#1c1917] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Complete cash bill  (F9)"}
        </button>
      </div>
    </div>
  );
}
