"use client";

import { METAL_KEYS, type JewelryRate } from "@/lib/billing/types";
import { formatINR } from "@/lib/money";

export function DailyRateBar({
  rates,
  draft,
  busy,
  onChange,
  onSave,
}: {
  rates: JewelryRate[];
  draft: Record<string, string>;
  busy?: boolean;
  onChange: (metalType: string, purity: string, value: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="billing-no-print sticky top-0 z-10 border-b border-[#e7e1d8] bg-[#fbfaf7]/95 px-4 py-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Daily metal rates</div>
          <div className="text-sm text-stone-500">Per gram · Gold, Silver, Platinum</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="rounded-md bg-[#c9a227] px-3 py-1.5 text-sm font-semibold text-[#1c1917] disabled:opacity-50"
        >
          Save rates
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {METAL_KEYS.map((metal) => {
          const key = `${metal.metalType}:${metal.purity}`;
          const saved = rates.find((r) => r.metalType === metal.metalType && r.purity === metal.purity);
          return (
            <label key={key} className="rounded-lg border border-[#e7e1d8] bg-white px-3 py-2">
              <div className="text-[11px] font-semibold text-stone-500">{metal.label}</div>
              <input
                inputMode="decimal"
                value={draft[key] ?? saved?.ratePerGram ?? ""}
                onChange={(e) => onChange(metal.metalType, metal.purity, e.target.value.replace(/[^\d.]/g, ""))}
                className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
              />
              <div className="text-[10px] text-stone-400">{saved ? formatINR(saved.ratePerGram) : "Not set"}</div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
