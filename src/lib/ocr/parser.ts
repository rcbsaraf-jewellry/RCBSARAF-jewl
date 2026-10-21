import { METAL_KEYS, type GstMode, type MakingMethod } from "@/lib/billing/types";
import type { DigitizerDraft, DigitizerItem } from "@/lib/ocr/types";

function asText(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function asAmount(value: unknown) {
  const text = asText(value).replace(/[₹,\s]/g, "");
  if (!text) return "";
  const n = Number(text);
  return Number.isFinite(n) ? String(n) : "";
}

function extractJson(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function metalFrom(value: unknown, purityHint: string): { metalType: string; purity: string } {
  const blob = `${asText(value)} ${purityHint}`.toUpperCase();
  if (blob.includes("PLAT")) return { metalType: "PLATINUM", purity: "950" };
  if (blob.includes("SILV")) return { metalType: "SILVER", purity: "999" };
  const purity = ["24K", "22K", "18K", "14K"].find((p) => blob.includes(p)) ?? "22K";
  return { metalType: "GOLD", purity };
}

function makingFrom(method: unknown, rate: unknown): { makingMethod: MakingMethod; makingRate: string } {
  const methodText = asText(method).toLowerCase();
  const rateText = asAmount(rate);
  if (methodText.includes("percent") || methodText.includes("%") || (Number(rateText) > 0 && Number(rateText) <= 30 && methodText.includes("making"))) {
    return { makingMethod: "percent", makingRate: rateText };
  }
  return { makingMethod: "per_gram", makingRate: rateText };
}

function itemFrom(raw: Record<string, unknown>): DigitizerItem | null {
  const itemName = asText(raw.itemName ?? raw.name ?? raw.description);
  const { metalType, purity } = metalFrom(raw.metalType ?? raw.metal, asText(raw.purity));
  const making = makingFrom(raw.makingMethod ?? raw.making, raw.makingRate ?? raw.makingCharge ?? raw.making_per_gram);
  const grossWeight = asAmount(raw.grossWeight ?? raw.gross_weight ?? raw.weight);
  const stoneWeight = asAmount(raw.stoneWeight ?? raw.stone_weight) || "0";
  if (!itemName && !grossWeight) return null;
  const allowed = METAL_KEYS.some((m) => m.metalType === metalType && m.purity === purity);
  return {
    itemName: itemName || "Jewellery item",
    huid: asText(raw.huid ?? raw.HUID).toUpperCase(),
    metalType: allowed ? metalType : "GOLD",
    purity: allowed ? purity : "22K",
    grossWeight,
    stoneWeight,
    makingMethod: making.makingMethod,
    makingRate: making.makingRate,
    stoneCharge: asAmount(raw.stoneCharge ?? raw.stone_value ?? raw.diamondValue) || "0",
    certificationFee: asAmount(raw.certificationFee ?? raw.cert_fee) || "0",
    diamondCarats: asAmount(raw.diamondCarats ?? raw.carats ?? raw.ct) || "0",
  };
}

export function parseDigitizerJson(raw: string): DigitizerDraft | null {
  const json = extractJson(raw);
  if (!json) return null;
  const gstRaw = asText(json.gstMode ?? json.gst_split).toLowerCase();
  const gstMode: GstMode | null = gstRaw.includes("igst") || gstRaw === "inter" ? "inter" : gstRaw.includes("cgst") || gstRaw === "intra" ? "intra" : null;
  const items = Array.isArray(json.items) ? json.items.map((row) => (row && typeof row === "object" ? itemFrom(row as Record<string, unknown>) : null)).filter((row): row is DigitizerItem => Boolean(row)) : [];
  if (!items.length && !asText(json.customerName ?? json.customer_name)) return null;
  return {
    customerName: asText(json.customerName ?? json.customer_name ?? json.billedTo),
    customerPhone: asText(json.customerPhone ?? json.phone ?? json.mobile).replace(/[^\d+]/g, ""),
    gstMode,
    advanceAmount: asAmount(json.advanceAmount ?? json.advance) || "0",
    items,
    confidence: Number(json.confidence) > 0 ? Math.min(1, Number(json.confidence)) : items.length ? 0.7 : 0.4,
  };
}

export function parseJewelryOcrText(text: string): DigitizerDraft | null {
  if (!text.trim()) return null;
  const phone = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/)?.[0] ?? "";
  const huid = text.match(/\bHUID[:\s-]*([A-Z0-9]{6,16})\b/i)?.[1] ?? "";
  const { metalType, purity } = metalFrom(text, text);
  const gross = text.match(/gross[^0-9]{0,12}(\d+(?:\.\d+)?)/i)?.[1] ?? text.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams?)\b/i)?.[1] ?? "";
  const stone = text.match(/stone[^0-9]{0,12}(\d+(?:\.\d+)?)/i)?.[1] ?? "0";
  const making = text.match(/making[^0-9%]{0,12}(\d+(?:\.\d+)?)\s*(%|\/\s*g|per\s*g)?/i);
  const nameLine = text.split(/\n/).map((l) => l.trim()).find((l) => /necklace|bangle|ring|chain|earring|pendant|set|bracelet/i.test(l)) ?? "";
  const customer = text.match(/(?:customer|billed to|name)[:\s]+([A-Za-z. ]{3,40})/i)?.[1] ?? "";
  const item = itemFrom({
    itemName: nameLine,
    huid,
    metalType,
    purity,
    grossWeight: gross,
    stoneWeight: stone,
    makingMethod: making?.[2]?.includes("%") ? "percent" : "per_gram",
    makingRate: making?.[1],
  });
  if (!item && !customer && !phone) return null;
  return {
    customerName: customer.trim(),
    customerPhone: phone.replace(/[^\d+]/g, ""),
    gstMode: /igst/i.test(text) ? "inter" : /cgst|sgst/i.test(text) ? "intra" : null,
    advanceAmount: asAmount(text.match(/advance[^0-9]{0,8}(\d+(?:\.\d+)?)/i)?.[1]) || "0",
    items: item ? [item] : [],
    confidence: item ? 0.45 : 0.25,
  };
}

export const DIGITIZE_PROMPT = `You read Indian jewellery shop bills, estimates, and handwritten counter slips.
Return ONLY JSON with this shape:
{
  "customerName": string,
  "customerPhone": string,
  "gstMode": "intra" | "inter" | "",
  "advanceAmount": string,
  "confidence": number,
  "items": [
    {
      "itemName": string,
      "huid": string,
      "metalType": "GOLD" | "SILVER" | "PLATINUM",
      "purity": "24K" | "22K" | "18K" | "14K" | "999" | "950",
      "grossWeight": string,
      "stoneWeight": string,
      "makingMethod": "percent" | "per_gram",
      "makingRate": string,
      "stoneCharge": string,
      "certificationFee": string,
      "diamondCarats": string
    }
  ]
}
Rules:
- Weights are grams. Diamonds are carats.
- Net metal weight is not needed; send gross and stone weights.
- Making % of metal value uses makingMethod "percent". Making ₹/gram uses "per_gram".
- HUID is the 6-character BIS hallmark unique ID when present.
- gstMode intra = CGST+SGST, inter = IGST.
- Empty fields are "". Do not invent HUID, phone, or weights.`;
