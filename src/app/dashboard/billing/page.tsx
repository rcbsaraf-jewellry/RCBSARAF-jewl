import Link from "next/link";
import { Banknote, Receipt } from "lucide-react";

export default function BillingIndexPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Billing workspace</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a jewellery billing model</h1>
      <p className="mt-3 max-w-xl text-stone-500">
        Model 1 supports split tenders and a full GST tax invoice. Model 2 is a fast counter flow with tendered cash and change due.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/billing/standard"
          className="rounded-2xl border border-[#e7e1d8] bg-white p-6 transition hover:border-[#c9a227] hover:shadow-[0_0_0_3px_rgba(201,162,39,.16)]"
        >
          <Receipt className="h-6 w-6 text-[#c9a227]" />
          <h2 className="mt-4 text-xl font-semibold">Model 1</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Multi-tender: cash, credit/debit card, cheque, and UPI with QR preview. Customer advance, HUID, weights, making, and GST split.
          </p>
        </Link>
        <Link
          href="/dashboard/billing/cash-only"
          className="rounded-2xl border border-[#e7e1d8] bg-white p-6 transition hover:border-[#c9a227] hover:shadow-[0_0_0_3px_rgba(201,162,39,.16)]"
        >
          <Banknote className="h-6 w-6 text-[#c9a227]" />
          <h2 className="mt-4 text-xl font-semibold">Model 2</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Strictly cash. Denomination keys, change calculator, and a simplified receipt. No card, cheque, or UPI controls.
          </p>
        </Link>
      </div>
    </div>
  );
}
