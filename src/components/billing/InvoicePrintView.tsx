"use client";

import { formatINR } from "@/lib/money";

type SavedBill = {
  bill: {
    billNumber: string;
    modelType: string;
    customerName: string;
    customerPhone: string | null;
    gstMode: string;
    grossAmount: string;
    makingChargesTotal: string;
    stoneChargesTotal: string;
    taxableAmount: string;
    gstTotal: string;
    cgst: string;
    sgst: string;
    igst: string;
    advanceAmount: string;
    finalAmount: string;
    cashReceived: string;
    changeDue: string;
    createdAt: Date | string;
  };
  items: Array<{
    itemName: string;
    huid: string | null;
    purity: string;
    metalType: string;
    grossWeight: string;
    stoneWeight: string;
    netWeight: string;
    ratePerGram: string;
    makingCharge: string;
    stoneCharge: string;
    diamondCarats: string;
    lineTotal: string;
  }>;
  payments: Array<{
    paymentMode: string;
    amount: string;
    transactionRef: string | null;
  }>;
};

export function InvoicePrintView({
  saved,
  onNewBill,
}: {
  saved: SavedBill;
  onNewBill: () => void;
}) {
  const created = new Date(saved.bill.createdAt);
  const cashOnly = saved.bill.modelType === "CASH_ONLY";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="billing-no-print mb-4 flex gap-2">
        <button type="button" onClick={() => window.print()} className="rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold">
          Print
        </button>
        <button type="button" onClick={onNewBill} className="rounded-md border border-[#e7e1d8] bg-white px-4 py-2 text-sm">
          New bill
        </button>
      </div>
      <article className="billing-print-sheet rounded-xl border border-[#e7e1d8] bg-white p-8 text-sm">
        <header className="flex items-start justify-between border-b border-[#e7e1d8] pb-4">
          <div>
            <div className="text-lg font-semibold">RCB Sarafa Jewellers</div>
            <div className="text-stone-500">42 Zaveri Bazaar · GSTIN 27AABCR1234M1Z5</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#8a6d1a]">{cashOnly ? "Cash receipt" : "Tax invoice"}</div>
            <div className="font-semibold">{saved.bill.billNumber}</div>
            <div className="text-stone-500">{created.toLocaleString("en-IN")}</div>
          </div>
        </header>
        <section className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] uppercase text-stone-400">Billed to</div>
            <div className="font-semibold">{saved.bill.customerName}</div>
            <div>{saved.bill.customerPhone}</div>
          </div>
          <div className="text-right text-stone-500">{saved.bill.gstMode === "inter" ? "IGST 3%" : "CGST 1.5% + SGST 1.5%"}</div>
        </section>
        <table className="mt-4 w-full text-left text-xs">
          <thead>
            <tr className="border-y border-[#e7e1d8] text-[10px] uppercase text-stone-500">
              <th className="py-2">Item / HUID</th>
              <th>Purity</th>
              <th>Gross</th>
              <th>Stone</th>
              <th>Net</th>
              <th>Rate</th>
              <th>Making</th>
              <th>Stone ₹</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {saved.items.map((item, i) => (
              <tr key={i} className="border-b border-[#f0ebe3]">
                <td className="py-2">
                  <div className="font-medium">{item.itemName}</div>
                  <div className="font-mono text-[10px] text-stone-500">{item.huid || "—"}</div>
                  {Number(item.diamondCarats) > 0 && <div className="text-[10px]">{item.diamondCarats} ct</div>}
                </td>
                <td>
                  {item.metalType} {item.purity}
                </td>
                <td>{item.grossWeight}g</td>
                <td>{item.stoneWeight}g</td>
                <td>{item.netWeight}g</td>
                <td>{formatINR(item.ratePerGram)}</td>
                <td>{formatINR(item.makingCharge)}</td>
                <td>{formatINR(item.stoneCharge)}</td>
                <td className="text-right font-semibold">{formatINR(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <Row k="Metal value" v={formatINR(saved.bill.grossAmount)} />
          <Row k="Making" v={formatINR(saved.bill.makingChargesTotal)} />
          <Row k="Stone / cert." v={formatINR(saved.bill.stoneChargesTotal)} />
          <Row k="Taxable" v={formatINR(saved.bill.taxableAmount)} />
          {saved.bill.gstMode === "inter" ? (
            <Row k="IGST 3%" v={formatINR(saved.bill.igst)} />
          ) : (
            <>
              <Row k="CGST 1.5%" v={formatINR(saved.bill.cgst)} />
              <Row k="SGST 1.5%" v={formatINR(saved.bill.sgst)} />
            </>
          )}
          <Row k="Advance" v={formatINR(saved.bill.advanceAmount)} />
          <div className="flex justify-between border-t border-[#1c1917] pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatINR(saved.bill.finalAmount)}</span>
          </div>
        </section>
        <section className="mt-4 text-xs text-stone-600">
          <div className="font-semibold text-[#1c1917]">Payments</div>
          {saved.payments.map((p, i) => (
            <div key={i}>
              {p.paymentMode} {formatINR(p.amount)}
              {p.transactionRef ? ` · ${p.transactionRef}` : ""}
            </div>
          ))}
          {cashOnly && (
            <div className="mt-1">
              Cash received {formatINR(saved.bill.cashReceived)} · Change {formatINR(saved.bill.changeDue)}
            </div>
          )}
        </section>
        <p className="mt-6 text-[11px] text-stone-400">Hallmarked jewellery · HUID recorded per line · This is a computer-generated invoice.</p>
      </article>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{k}</span>
      <span>{v}</span>
    </div>
  );
}
