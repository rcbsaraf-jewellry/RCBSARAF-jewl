export const BILL_MODELS = ["STANDARD", "CASH_ONLY"] as const;
export type BillModel = (typeof BILL_MODELS)[number];

export const PAYMENT_MODES = ["CASH", "UPI", "CARD", "CHEQUE"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const MAKING_METHODS = ["percent", "per_gram"] as const;
export type MakingMethod = (typeof MAKING_METHODS)[number];

export const GST_MODES = ["intra", "inter"] as const;
export type GstMode = (typeof GST_MODES)[number];

export const METAL_KEYS = [
  { metalType: "GOLD", purity: "24K", label: "Gold 24K" },
  { metalType: "GOLD", purity: "22K", label: "Gold 22K" },
  { metalType: "GOLD", purity: "18K", label: "Gold 18K" },
  { metalType: "GOLD", purity: "14K", label: "Gold 14K" },
  { metalType: "SILVER", purity: "999", label: "Silver" },
  { metalType: "PLATINUM", purity: "950", label: "Platinum" },
] as const;

export type MetalKey = (typeof METAL_KEYS)[number];

export type JewelryRate = {
  id: string;
  metalType: string;
  purity: string;
  ratePerGram: string;
  updatedAt: string;
};

export type LineDraft = {
  id: string;
  itemName: string;
  huid: string;
  metalType: string;
  purity: string;
  grossWeight: string;
  stoneWeight: string;
  makingMethod: MakingMethod;
  makingRate: string;
  stoneCharge: string;
  certificationFee: string;
  diamondCarats: string;
};

export type LineComputation = {
  netWeight: string;
  ratePerGram: string;
  metalValue: string;
  makingCharge: string;
  stoneCharge: string;
  taxable: string;
  lineTotal: string;
};

export type TenderLine = {
  id: string;
  paymentMode: PaymentMode;
  amount: string;
  transactionRef: string;
  /** Client-only: Credit Card vs Debit Card both persist as CARD. */
  cardKind?: "CREDIT" | "DEBIT";
};

export type BillSummary = {
  itemCount: number;
  grossAmount: string;
  makingChargesTotal: string;
  stoneChargesTotal: string;
  taxableAmount: string;
  gstRate: string;
  gstTotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  finalAmount: string;
  advanceAmount: string;
  payableAmount: string;
  tenderedAmount: string;
  changeDue: string;
  tenderValid: boolean;
  tenderError: string | null;
};
