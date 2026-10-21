import { NextResponse } from "next/server";
import { requireBillingSession } from "@/lib/billing/guard";
import { DIGITIZER_DOC_TYPES, DIGITIZER_IMAGE_TYPES, DIGITIZER_MAX_BYTES } from "@/lib/ocr/types";
import { digitizeBillMedia } from "@/lib/ocr/vision";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set<string>([...DIGITIZER_IMAGE_TYPES, ...DIGITIZER_DOC_TYPES]);

export async function POST(req: Request) {
  const session = await requireBillingSession();
  if (!session.ok) return session.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Attach a bill photo or PDF." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > DIGITIZER_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "File must be an image or PDF under 8 MB." }, { status: 400 });
  }
  const mime = file.type || guessMime(file.name);
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ ok: false, error: "Use JPG, PNG, WebP, or PDF." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const draft = await digitizeBillMedia({ mime, bytes, filename: file.name || "bill" });
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not digitize this bill.";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

function guessMime(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "";
}
