"use client";

import { allowedPaymentModes } from "@/lib/billing/calculator";
import type { BillSummary, TenderLine } from "@/lib/billing/types";
import { formatINR } from "@/lib/money";
import { Plus, Trash2, X } from "lucide-react";

function upiUri(amount: string, name: string) {
  const params = new URLSearchParams({
    pa: "rcbsarafa@upi",
    pn: "RCB Sarafa Jewellers",
    am: amount,
    cu: "INR",
    tn: `Jewellery bill ${name}`,
  });
  return `upi://pay?${params.toString()}`;
}

export function Model1PaymentModal({
  open,
  summary,
  customerName,
  gstMode,
  tenders,
  busy,
  error,
  onGstMode,
  onAdvance,
  onTenders,
  onClose,
  onConfirm,
}: {
  open: boolean;
  summary: BillSummary;
  customerName: string;
  gstMode: "intra" | "inter";
  tenders: TenderLine[];
  busy?: boolean;
  error?: string | null;
  onGstMode: (mode: "intra" | "inter") => void;
  onAdvance: (value: string) => void;
  onTenders: (next: TenderLine[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  const modes = allowedPaymentModes("STANDARD");

  function patch(id: string, next: Partial<TenderLine>) {
    onTenders(tenders.map((row) => (row.id === id ? { ...row, ...next } : row)));
  }

  return (
    <div className="billing-no-print fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Model 1</div>
            <h3 className="text-lg font-semibold">Collect payment</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            GST split
            <select value={gstMode} onChange={(e) => onGstMode(e.target.value as "intra" | "inter")} className="mt-1 w-full rounded-md border border-[#e7e1d8] px-2 py-2">
              <option value="intra">CGST 1.5% + SGST 1.5%</option>
              <option value="inter">IGST 3%</option>
            </select>
          </label>
          <label className="text-sm">
            Customer advance
            <input
              inputMode="decimal"
              value={summary.advanceAmount}
              onChange={(e) => onAdvance(e.target.value.replace(/[^\d.]/g, ""))}
              className="mt-1 w-full rounded-md border border-[#e7e1d8] px-2 py-2"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {tenders.map((tender) => (
            <div key={tender.id} className="grid grid-cols-[140px_1fr_1fr_auto] gap-2">
              <select
                value={tender.paymentMode === "CARD" ? `CARD:${tender.cardKind ?? "CREDIT"}` : tender.paymentMode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "CARD:CREDIT" || value === "CARD:DEBIT") {
                    patch(tender.id, { paymentMode: "CARD", cardKind: value === "CARD:CREDIT" ? "CREDIT" : "DEBIT" });
                    return;
                  }
                  patch(tender.id, { paymentMode: value as TenderLine["paymentMode"], cardKind: undefined });
                }}
                className="rounded-md border border-[#e7e1d8] px-2 py-2 text-sm"
              >
                {modes.flatMap((mode) =>
                  mode === "CARD"
                    ? [
                        <option key="CARD:CREDIT" value="CARD:CREDIT">
                          Credit Card
                        </option>,
                        <option key="CARD:DEBIT" value="CARD:DEBIT">
                          Debit Card
                        </option>,
                      ]
                    : [
                        <option key={mode} value={mode}>
                          {mode === "CHEQUE" ? "Cheque" : mode}
                        </option>,
                      ],
                )}
              </select>
              <input
                inputMode="decimal"
                value={tender.amount}
                placeholder="Amount"
                onChange={(e) => patch(tender.id, { amount: e.target.value.replace(/[^\d.]/g, "") })}
                className="rounded-md border border-[#e7e1d8] px-2 py-2"
              />
              <input
                value={tender.transactionRef}
                placeholder={
                  tender.paymentMode === "CHEQUE"
                    ? "Cheque no."
                    : tender.paymentMode === "CARD"
                      ? `${tender.cardKind === "DEBIT" ? "Debit" : "Credit"} approval / last 4`
                      : "Txn / UTR / last 4"
                }
                onChange={(e) => patch(tender.id, { transactionRef: e.target.value })}
                className="rounded-md border border-[#e7e1d8] px-2 py-2"
              />
              <button type="button" onClick={() => onTenders(tenders.filter((row) => row.id !== tender.id))} className="rounded-md p-2 text-stone-400 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onTenders([...tenders, { id: crypto.randomUUID(), paymentMode: "CASH", amount: "", transactionRef: "" }])
            }
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#8a6d1a]"
          >
            <Plus className="h-4 w-4" /> Add tender split
          </button>
        </div>

        {tenders.some((t) => t.paymentMode === "UPI") && (
          <div className="mt-4 grid gap-3 rounded-xl border border-[#e7e1d8] bg-[#f4f1ea] p-3 sm:grid-cols-[140px_1fr]">
            <div className="grid place-items-center rounded-lg bg-white p-2">
              <div className="grid h-28 w-28 grid-cols-7 gap-px bg-stone-900 p-1">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={i % 3 === 0 || i % 5 === 0 ? "bg-stone-900" : "bg-white"} />
                ))}
              </div>
              <div className="mt-1 text-[10px] text-stone-500">UPI QR preview</div>
            </div>
            <div className="text-xs leading-5 text-stone-600">
              <div className="font-semibold text-[#1c1917]">Scan with any UPI app</div>
              <div className="mt-1 break-all font-mono">{upiUri(summary.payableAmount, customerName || "Customer")}</div>
              <div className="mt-2">Enter the UTR in the UPI tender row after the customer pays.</div>
            </div>
          </div>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>Taxable {formatINR(summary.taxableAmount)}</div>
          <div>GST 3% {formatINR(summary.gstTotal)}</div>
          <div>Advance {formatINR(summary.advanceAmount)}</div>
          <div className="font-semibold">Payable {formatINR(summary.payableAmount)}</div>
          <div>Tendered {formatINR(summary.tenderedAmount)}</div>
          <div>Change {formatINR(summary.changeDue)}</div>
        </dl>
        {(error || summary.tenderError) && <p className="mt-3 text-sm text-rose-700">{error || summary.tenderError}</p>}
        <button
          type="button"
          disabled={busy || !summary.tenderValid}
          onClick={onConfirm}
          className="mt-4 w-full rounded-md bg-[#c9a227] py-2.5 text-sm font-semibold text-[#1c1917] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save GST invoice"}
        </button>
      </div>
    </div>
  );
}
