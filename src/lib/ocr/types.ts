import type { GstMode, LineDraft } from "@/lib/billing/types";

export const DIGITIZER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DIGITIZER_DOC_TYPES = ["application/pdf"] as const;
export const DIGITIZER_MAX_BYTES = 8 * 1024 * 1024;

export type DigitizerItem = Omit<LineDraft, "id">;

export type DigitizerDraft = {
  customerName: string;
  customerPhone: string;
  gstMode: GstMode | null;
  advanceAmount: string;
  items: DigitizerItem[];
  confidence: number;
};

export type DigitizerApplyInput = {
  customerName: string;
  customerPhone: string;
  gstMode: GstMode;
  advanceAmount: string;
  items: LineDraft[];
};
