import type { BillModel, LineDraft } from "@/lib/billing/types";
import type { DigitizerApplyInput, DigitizerDraft } from "@/lib/ocr/types";

function isBlankLine(item: LineDraft) {
  return !item.itemName.trim() && !item.grossWeight.trim();
}

export function applyDigitizerDraft(input: {
  draft: DigitizerDraft;
  model: BillModel;
  current: DigitizerApplyInput;
  nextId?: () => string;
}): DigitizerApplyInput {
  const nextId = input.nextId ?? (() => crypto.randomUUID());
  const incoming = input.draft.items.map((item) => ({ ...item, id: nextId() }));
  const kept = input.current.items.filter((item) => !isBlankLine(item));
  const items = incoming.length ? [...kept, ...incoming] : input.current.items.length ? input.current.items : incoming;

  return {
    customerName: input.draft.customerName || input.current.customerName,
    customerPhone: input.draft.customerPhone || input.current.customerPhone,
    gstMode: input.model === "CASH_ONLY" ? "intra" : input.draft.gstMode ?? input.current.gstMode,
    advanceAmount: input.model === "CASH_ONLY" ? "0" : input.draft.advanceAmount || input.current.advanceAmount,
    items: items.length ? items : input.current.items,
  };
}
