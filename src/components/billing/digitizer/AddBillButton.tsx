"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { DigitizerModal } from "@/components/billing/digitizer/DigitizerModal";
import type { DigitizerDraft } from "@/lib/ocr/types";

export function AddBillButton({ onDraft }: { onDraft: (draft: DigitizerDraft) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-[#e7e1d8] bg-white px-4 py-2 text-sm font-semibold text-[#1c1917] hover:border-[#c9a227]"
      >
        <ScanLine className="h-4 w-4 text-[#c9a227]" />
        Add Bill
      </button>
      <DigitizerModal open={open} onClose={() => setOpen(false)} onDraft={onDraft} />
    </>
  );
}
