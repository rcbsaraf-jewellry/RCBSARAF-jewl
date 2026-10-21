import { m } from "@/lib/money";
import type { BillModel, GstMode, LineComputation, PaymentMode, TenderLine } from "@/lib/billing/types";

const GST_RATE = m(3);

function r2(value: ReturnType<typeof m>) {
  return value.round(2).toFixed(2);
}

function r4(value: ReturnType<typeof m>) {
  return value.round(4).toFixed(4);
}

export function netMetalWeight(grossWeight: string | number, stoneWeight: string | number) {
  const net = m(grossWeight).minus(m(stoneWeight));
  return r4(net.lt(0) ? m(0) : net);
}

export function calculateJewelryLineItem(input: {
  grossWeight: string | number;
  stoneWeight: string | number;
  ratePerGram: string | number;
  makingMethod: "percent" | "per_gram";
  makingRate: string | number;
  stoneCharge: string | number;
  certificationFee?: string | number;
}): LineComputation {
  const netWeight = netMetalWeight(input.grossWeight, input.stoneWeight);
  const ratePerGram = r2(m(input.ratePerGram));
  const metalValue = m(netWeight).times(m(ratePerGram));
  const makingCharge =
    input.makingMethod === "percent"
      ? metalValue.times(m(input.makingRate)).div(100)
      : m(netWeight).times(m(input.makingRate));
  const stoneCharge = m(input.stoneCharge).plus(m(input.certificationFee));
  const taxable = metalValue.plus(makingCharge).plus(stoneCharge);
  return {
    netWeight,
    ratePerGram,
    metalValue: r2(metalValue),
    makingCharge: r2(makingCharge),
    stoneCharge: r2(stoneCharge),
    taxable: r2(taxable),
    lineTotal: r2(taxable),
  };
}

export function calculateBillSummary(input: {
  lines: LineComputation[];
  gstMode?: GstMode;
  advanceAmount?: string | number;
  tenders?: Array<Pick<TenderLine, "paymentMode" | "amount">>;
  cashReceived?: string | number;
  model: BillModel;
}) {
  const gstMode: GstMode = input.gstMode ?? "intra";
  let grossAmount = m(0);
  let makingChargesTotal = m(0);
  let stoneChargesTotal = m(0);
  let taxableAmount = m(0);

  for (const line of input.lines) {
    grossAmount = grossAmount.plus(m(line.metalValue));
    makingChargesTotal = makingChargesTotal.plus(m(line.makingCharge));
    stoneChargesTotal = stoneChargesTotal.plus(m(line.stoneCharge));
    taxableAmount = taxableAmount.plus(m(line.taxable));
  }

  const gstTotal = taxableAmount.times(GST_RATE).div(100);
  const cgst = gstMode === "intra" ? gstTotal.div(2) : m(0);
  const sgst = gstMode === "intra" ? gstTotal.minus(cgst.round(2)) : m(0);
  const igst = gstMode === "inter" ? gstTotal : m(0);
  const gstRounded = gstTotal.round(2);
  const finalAmount = taxableAmount.plus(gstRounded);
  const advanceAmount = m(input.advanceAmount);
  const payableAmount = finalAmount.minus(advanceAmount).lt(0) ? m(0) : finalAmount.minus(advanceAmount);

  let tenderedAmount = m(0);
  let nonCash = m(0);
  const tenders = input.tenders ?? [];
  for (const tender of tenders) {
    tenderedAmount = tenderedAmount.plus(m(tender.amount));
    if (tender.paymentMode !== "CASH") nonCash = nonCash.plus(m(tender.amount));
  }

  const cashReceived = input.model === "CASH_ONLY" ? m(input.cashReceived) : tenderedAmount;
  let tenderValid = true;
  let tenderError: string | null = null;

  if (input.model === "CASH_ONLY") {
    if (tenders.some((t) => t.paymentMode !== "CASH")) {
      tenderValid = false;
      tenderError = "Cash-only billing accepts cash tenders exclusively.";
    } else if (cashReceived.lt(payableAmount)) {
      tenderValid = false;
      tenderError = "Cash received is less than the amount payable.";
    }
  } else if (tenderedAmount.plus(advanceAmount).lt(finalAmount)) {
    tenderValid = false;
    tenderError = "Collected tenders plus advance must cover the invoice total.";
  }

  const changeDue =
    input.model === "CASH_ONLY"
      ? cashReceived.minus(payableAmount)
      : tenderedAmount.minus(payableAmount);

  return {
    itemCount: input.lines.length,
    grossAmount: r2(grossAmount),
    makingChargesTotal: r2(makingChargesTotal),
    stoneChargesTotal: r2(stoneChargesTotal),
    taxableAmount: r2(taxableAmount),
    gstRate: r2(GST_RATE),
    gstTotal: r2(gstRounded),
    cgst: r2(cgst),
    sgst: r2(sgst),
    igst: r2(igst),
    finalAmount: r2(finalAmount),
    advanceAmount: r2(advanceAmount),
    payableAmount: r2(payableAmount),
    tenderedAmount: r2(input.model === "CASH_ONLY" ? cashReceived : tenderedAmount),
    changeDue: r2(changeDue.lt(0) ? m(0) : changeDue),
    tenderValid,
    tenderError,
  };
}

export function allowedPaymentModes(model: BillModel): PaymentMode[] {
  return model === "CASH_ONLY" ? ["CASH"] : ["CASH", "UPI", "CARD", "CHEQUE"];
}
