"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateBillSummary, calculateJewelryLineItem } from "@/lib/billing/calculator";
import { DailyRateBar } from "@/components/billing/DailyRateBar";
import { InvoicePrintView } from "@/components/billing/InvoicePrintView";
import { ItemEntryTable } from "@/components/billing/ItemEntryTable";
import { AddBillButton } from "@/components/billing/digitizer/AddBillButton";
import { Model1PaymentModal } from "@/components/billing/Model1PaymentModal";
import { Model2CashModal } from "@/components/billing/Model2CashModal";
import type { BillModel, GstMode, JewelryRate, LineDraft, TenderLine } from "@/lib/billing/types";
import { applyDigitizerDraft } from "@/lib/ocr/form-handlers";
import type { DigitizerDraft } from "@/lib/ocr/types";
import { formatINR } from "@/lib/money";

function emptyLine(): LineDraft {
  return {
    id: crypto.randomUUID(),
    itemName: "",
    huid: "",
    metalType: "GOLD",
    purity: "22K",
    grossWeight: "",
    stoneWeight: "0",
    makingMethod: "per_gram",
    makingRate: "",
    stoneCharge: "0",
    certificationFee: "0",
    diamondCarats: "0",
  };
}

export function BillingWorkbench({ model }: { model: BillModel }) {
  const cashOnly = model === "CASH_ONLY";
  const [rates, setRates] = useState<JewelryRate[]>([]);
  const [draftRates, setDraftRates] = useState<Record<string, string>>({});
  const [items, setItems] = useState<LineDraft[]>([emptyLine()]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [gstMode, setGstMode] = useState<GstMode>("intra");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [cashReceived, setCashReceived] = useState("");
  const [tenders, setTenders] = useState<TenderLine[]>([
    { id: crypto.randomUUID(), paymentMode: "CASH", amount: "", transactionRef: "" },
  ]);
  const [payOpen, setPayOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Parameters<typeof InvoicePrintView>[0]["saved"] | null>(null);
  const payOpenRef = useRef(false);
  const saveBillRef = useRef<() => void>(() => undefined);
  const tenderValidRef = useRef(false);

  useEffect(() => {
    fetch("/api/billing/rates")
      .then((r) => r.json())
      .then((d) => {
        if (d.rates) setRates(d.rates);
      })
      .catch(() => setError("Could not load metal rates."));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        setItems((rows) => [...rows, emptyLine()]);
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (payOpenRef.current) {
          if (tenderValidRef.current) saveBillRef.current();
          return;
        }
        setPayOpen(true);
      }
      if (e.key === "Escape") setPayOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const computedLines = useMemo(
    () =>
      items.map((item) =>
        calculateJewelryLineItem({
          grossWeight: item.grossWeight,
          stoneWeight: item.stoneWeight,
          ratePerGram: rates.find((r) => r.metalType === item.metalType && r.purity === item.purity)?.ratePerGram ?? "0",
          makingMethod: item.makingMethod,
          makingRate: item.makingRate,
          stoneCharge: item.stoneCharge,
          certificationFee: item.certificationFee,
        }),
      ),
    [items, rates],
  );

  const summary = useMemo(
    () =>
      calculateBillSummary({
        lines: computedLines,
        gstMode,
        advanceAmount: cashOnly ? "0" : advanceAmount,
        tenders: cashOnly ? [{ paymentMode: "CASH", amount: cashReceived }] : tenders,
        cashReceived,
        model,
      }),
    [computedLines, gstMode, advanceAmount, tenders, cashReceived, model, cashOnly],
  );
  payOpenRef.current = payOpen;
  tenderValidRef.current = summary.tenderValid;

  async function saveRates() {
    setBusy(true);
    setError(null);
    const payload = Object.entries(draftRates).map(([key, ratePerGram]) => {
      const [metalType, purity] = key.split(":");
      return { metalType, purity, ratePerGram };
    });
    try {
      const res = await fetch("/api/billing/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: payload.length
            ? payload
            : rates.map((r) => ({ metalType: r.metalType, purity: r.purity, ratePerGram: r.ratePerGram })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save rates.");
        return;
      }
      setRates(data.rates);
      setDraftRates({});
    } catch {
      setError("Could not save rates.");
    } finally {
      setBusy(false);
    }
  }

  async function saveBill() {
    if (!customerName.trim()) {
      setError("Enter the customer name before collecting payment.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: model,
          customerName,
          customerPhone,
          gstMode: cashOnly ? "intra" : gstMode,
          advanceAmount: cashOnly ? "0" : advanceAmount,
          cashReceived: cashOnly ? cashReceived : "0",
          items,
          tenders: cashOnly ? [] : tenders,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.bill) {
        setError(data.error ?? "Could not save bill.");
        return;
      }
      setSaved(data.bill);
      setPayOpen(false);
    } catch {
      setError("Could not save bill.");
    } finally {
      setBusy(false);
    }
  }
  saveBillRef.current = () => {
    void saveBill();
  };

  function resetBill() {
    setSaved(null);
    setItems([emptyLine()]);
    setCustomerName("");
    setCustomerPhone("");
    setAdvanceAmount("0");
    setCashReceived("");
    setTenders([{ id: crypto.randomUUID(), paymentMode: "CASH", amount: "", transactionRef: "" }]);
    setError(null);
  }

  if (saved) return <InvoicePrintView saved={saved} onNewBill={resetBill} />;

  return (
    <div className="min-h-full">
      <DailyRateBar
        rates={rates}
        draft={draftRates}
        busy={busy}
        onChange={(metalType, purity, value) => setDraftRates((d) => ({ ...d, [`${metalType}:${purity}`]: value }))}
        onSave={() => void saveRates()}
      />
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/dashboard/billing" className="text-xs text-stone-500 hover:text-[#1c1917]">
              All billing models
            </Link>
            <h1 className="text-2xl font-semibold">{cashOnly ? "Model 2" : "Model 1"}</h1>
            <p className="text-sm text-stone-500">
              {cashOnly ? "Cash tender only. F2 add line · F9 cash out." : "Split cash, card, cheque, and UPI. F2 add line · F9 collect."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddBillButton
              onDraft={(draft: DigitizerDraft) => {
                const next = applyDigitizerDraft({
                  draft,
                  model,
                  current: { customerName, customerPhone, gstMode, advanceAmount, items },
                });
                setCustomerName(next.customerName);
                setCustomerPhone(next.customerPhone);
                setGstMode(next.gstMode);
                setAdvanceAmount(next.advanceAmount);
                setItems(next.items);
                setError(null);
              }}
            />
            <button type="button" onClick={() => setPayOpen(true)} className="hidden min-h-12 touch-manipulation rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1c1917] lg:inline-flex lg:items-center">
              {cashOnly ? "Cash out (F9)" : "Collect payment (F9)"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Customer name
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 min-h-12 w-full rounded-md border border-[#e7e1d8] bg-white px-3 py-2 lg:min-h-0" />
              </label>
              <label className="text-sm">
                Phone
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 min-h-12 w-full rounded-md border border-[#e7e1d8] bg-white px-3 py-2 lg:min-h-0" />
              </label>
            </div>
            <ItemEntryTable
              items={items}
              rates={rates}
              onAdd={() => setItems((rows) => [...rows, emptyLine()])}
              onRemove={(id) => setItems((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.id !== id)))}
              onChange={(id, patch) => setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)))}
            />
          </div>
          <aside className="rounded-xl border border-[#e7e1d8] bg-white p-4 text-sm lg:sticky lg:top-4 lg:col-span-5 lg:self-start">
            <div className="flex justify-between">
              <span>Metal value</span>
              <span>{formatINR(summary.grossAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Making</span>
              <span>{formatINR(summary.makingChargesTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stone / cert.</span>
              <span>{formatINR(summary.stoneChargesTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable</span>
              <span>{formatINR(summary.taxableAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST 3%</span>
              <span>{formatINR(summary.gstTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#e7e1d8] pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatINR(summary.finalAmount)}</span>
            </div>
          </aside>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      </div>
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-[#e7e1d8] bg-[#fbfaf7] px-3 py-3 md:bottom-0 lg:hidden">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-stone-500">Total</div>
          <div className="text-lg font-semibold">{formatINR(summary.finalAmount)}</div>
        </div>
        <button
          type="button"
          onClick={() => setPayOpen(true)}
          className={`flex min-h-12 touch-manipulation items-center rounded-md px-4 text-sm font-semibold ${cashOnly ? "bg-[#1f8a5b] text-white" : "bg-[#c9a227] text-[#1c1917]"}`}
        >
          {cashOnly ? "Complete Cash Sale" : "Collect payment"}
        </button>
      </div>

      {cashOnly ? (
        <Model2CashModal
          open={payOpen}
          summary={summary}
          cashReceived={cashReceived}
          busy={busy}
          error={error}
          onCashReceived={setCashReceived}
          onClose={() => setPayOpen(false)}
          onConfirm={() => void saveBill()}
        />
      ) : (
        <Model1PaymentModal
          open={payOpen}
          summary={summary}
          customerName={customerName}
          gstMode={gstMode}
          tenders={tenders}
          busy={busy}
          error={error}
          onGstMode={setGstMode}
          onAdvance={setAdvanceAmount}
          onTenders={setTenders}
          onClose={() => setPayOpen(false)}
          onConfirm={() => void saveBill()}
        />
      )}
    </div>
  );
}
