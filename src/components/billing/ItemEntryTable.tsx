"use client";

import { useState } from "react";
import { calculateJewelryLineItem } from "@/lib/billing/calculator";
import { TouchKeypad } from "@/components/billing/TouchKeypad";
import { METAL_KEYS, type JewelryRate, type LineDraft } from "@/lib/billing/types";
import { formatINR } from "@/lib/money";
import { Plus, Trash2 } from "lucide-react";

function rateFor(rates: JewelryRate[], metalType: string, purity: string) {
  return rates.find((r) => r.metalType === metalType && r.purity === purity)?.ratePerGram ?? "0";
}

export function ItemEntryTable({
  items,
  rates,
  onChange,
  onAdd,
  onRemove,
}: {
  items: LineDraft[];
  rates: JewelryRate[];
  onChange: (id: string, patch: Partial<LineDraft>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [keypad, setKeypad] = useState<{ id: string; field: "grossWeight" | "makingRate" | "stoneCharge" } | null>(null);

  return (
    <>
    <div className="space-y-3 md:hidden">
      {items.map((item) => {
        const computed = calculateJewelryLineItem({
          grossWeight: item.grossWeight,
          stoneWeight: item.stoneWeight,
          ratePerGram: rateFor(rates, item.metalType, item.purity),
          makingMethod: item.makingMethod,
          makingRate: item.makingRate,
          stoneCharge: item.stoneCharge,
          certificationFee: item.certificationFee,
        });
        return (
          <article key={item.id} className="rounded-2xl border border-[#e7e1d8] bg-white p-3">
            <input
              value={item.itemName}
              placeholder="Necklace / bangle"
              onChange={(e) => onChange(item.id, { itemName: e.target.value })}
              className="min-h-12 w-full rounded-md border border-[#e7e1d8] bg-[#f4f1ea] px-3"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {METAL_KEYS.filter((m) => m.metalType === "GOLD").map((metal) => {
                const selected = item.metalType === metal.metalType && item.purity === metal.purity;
                return (
                  <button
                    key={`${metal.metalType}:${metal.purity}`}
                    type="button"
                    onClick={() => onChange(item.id, { metalType: metal.metalType, purity: metal.purity })}
                    className={`min-h-12 touch-manipulation rounded-full px-3 text-sm font-semibold ${selected ? "bg-[#c9a227] text-[#1c1917]" : "border border-[#e7e1d8] bg-white"}`}
                  >
                    {metal.purity}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setKeypad({ id: item.id, field: "grossWeight" })}
              className="mt-2 flex min-h-12 w-full items-center justify-between rounded-md border border-[#e7e1d8] px-3 text-sm"
            >
              <span>Gross weight</span>
              <span className="font-semibold">{item.grossWeight || "0"} g</span>
            </button>
            <button
              type="button"
              onClick={() => setKeypad({ id: item.id, field: "makingRate" })}
              className="mt-2 flex min-h-12 w-full items-center justify-between rounded-md border border-[#e7e1d8] px-3 text-sm"
            >
              <span>Making</span>
              <span className="font-semibold">{item.makingRate || "0"}</span>
            </button>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>Line</span>
              <span className="font-semibold">{formatINR(computed.lineTotal)}</span>
            </div>
            {keypad?.id === item.id && (
              <TouchKeypad
                value={item[keypad.field]}
                onChange={(next) => onChange(item.id, { [keypad.field]: next })}
                onDone={() => setKeypad(null)}
              />
            )}
            <button type="button" onClick={() => onRemove(item.id)} className="mt-2 inline-flex min-h-12 items-center gap-2 text-sm text-rose-700">
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </article>
        );
      })}
      <button type="button" onClick={onAdd} className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#8a6d1a]">
        <Plus className="h-4 w-4" /> Add jewellery line
      </button>
    </div>
    <div className="hidden overflow-x-auto rounded-xl border border-[#e7e1d8] bg-white md:block">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-[#f8efd4] text-[11px] uppercase tracking-[0.12em] text-stone-600">
          <tr>
            <th className="px-3 py-2">Item / HUID</th>
            <th className="px-3 py-2">Purity</th>
            <th className="px-3 py-2">Gross g</th>
            <th className="px-3 py-2">Stone g</th>
            <th className="px-3 py-2">Net g</th>
            <th className="px-3 py-2">Making</th>
            <th className="px-3 py-2">Stone / cert.</th>
            <th className="px-3 py-2 text-right">Line</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const computed = calculateJewelryLineItem({
              grossWeight: item.grossWeight,
              stoneWeight: item.stoneWeight,
              ratePerGram: rateFor(rates, item.metalType, item.purity),
              makingMethod: item.makingMethod,
              makingRate: item.makingRate,
              stoneCharge: item.stoneCharge,
              certificationFee: item.certificationFee,
            });
            return (
              <tr key={item.id} className="border-t border-[#eee8df] align-top">
                <td className="px-3 py-2">
                  <input
                    value={item.itemName}
                    placeholder="Necklace / bangle"
                    onChange={(e) => onChange(item.id, { itemName: e.target.value })}
                    className="w-full rounded-md border border-[#e7e1d8] bg-[#f4f1ea] px-2 py-1.5 outline-none focus:border-[#c9a227]"
                  />
                  <input
                    value={item.huid}
                    placeholder="HUID"
                    maxLength={16}
                    onChange={(e) => onChange(item.id, { huid: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-md border border-[#e7e1d8] bg-white px-2 py-1 font-mono text-xs outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={`${item.metalType}:${item.purity}`}
                    onChange={(e) => {
                      const [metalType, purity] = e.target.value.split(":");
                      onChange(item.id, { metalType, purity });
                    }}
                    className="w-full rounded-md border border-[#e7e1d8] bg-white px-2 py-1.5"
                  >
                    {METAL_KEYS.map((metal) => (
                      <option key={`${metal.metalType}:${metal.purity}`} value={`${metal.metalType}:${metal.purity}`}>
                        {metal.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[11px] text-stone-500">{formatINR(rateFor(rates, item.metalType, item.purity))}/g</div>
                </td>
                <td className="px-3 py-2">
                  <input
                    inputMode="decimal"
                    value={item.grossWeight}
                    onChange={(e) => onChange(item.id, { grossWeight: e.target.value.replace(/[^\d.]/g, "") })}
                    className="w-24 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    inputMode="decimal"
                    value={item.stoneWeight}
                    onChange={(e) => onChange(item.id, { stoneWeight: e.target.value.replace(/[^\d.]/g, "") })}
                    className="w-20 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                </td>
                <td className="px-3 py-2 font-semibold">{computed.netWeight}</td>
                <td className="px-3 py-2">
                  <select
                    value={item.makingMethod}
                    onChange={(e) => onChange(item.id, { makingMethod: e.target.value as LineDraft["makingMethod"] })}
                    className="mb-1 w-full rounded-md border border-[#e7e1d8] px-2 py-1 text-xs"
                  >
                    <option value="per_gram">₹ / gram</option>
                    <option value="percent">% of metal</option>
                  </select>
                  <input
                    inputMode="decimal"
                    value={item.makingRate}
                    placeholder={item.makingMethod === "percent" ? "%" : "₹/g"}
                    onChange={(e) => onChange(item.id, { makingRate: e.target.value.replace(/[^\d.]/g, "") })}
                    className="w-24 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    inputMode="decimal"
                    value={item.stoneCharge}
                    placeholder="Stone ₹"
                    onChange={(e) => onChange(item.id, { stoneCharge: e.target.value.replace(/[^\d.]/g, "") })}
                    className="mb-1 w-24 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                  <input
                    inputMode="decimal"
                    value={item.certificationFee}
                    placeholder="Cert ₹"
                    onChange={(e) => onChange(item.id, { certificationFee: e.target.value.replace(/[^\d.]/g, "") })}
                    className="w-24 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                  <input
                    inputMode="decimal"
                    value={item.diamondCarats}
                    placeholder="Ct"
                    onChange={(e) => onChange(item.id, { diamondCarats: e.target.value.replace(/[^\d.]/g, "") })}
                    className="mt-1 w-24 rounded-md border border-[#e7e1d8] px-2 py-1.5"
                  />
                </td>
                <td className="px-3 py-2 text-right font-semibold">{formatINR(computed.lineTotal)}</td>
                <td className="px-2 py-2">
                  <button type="button" onClick={() => onRemove(item.id)} className="rounded-md p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-[#e7e1d8] p-3">
        <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 text-sm font-semibold text-[#8a6d1a]">
          <Plus className="h-4 w-4" /> Add jewellery line
        </button>
        <span className="ml-3 text-[11px] text-stone-400">F2</span>
      </div>
    </div>
    </>
  );
}
