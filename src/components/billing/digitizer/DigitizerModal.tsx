"use client";

import { useRef, useState } from "react";
import { Camera, FileUp, Images, X } from "lucide-react";
import { CameraCaptureModal } from "@/components/billing/digitizer/CameraCaptureModal";
import type { DigitizerDraft } from "@/lib/ocr/types";
import { DIGITIZER_MAX_BYTES } from "@/lib/ocr/types";

const STEPS = ["Uploading", "AI analyzing", "Extracting jewellery items", "Populating form"] as const;

export function DigitizerModal({
  open,
  onClose,
  onDraft,
}: {
  open: boolean;
  onClose: () => void;
  onDraft: (draft: DigitizerDraft) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFallbackRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(file: File) {
    if (file.size > DIGITIZER_MAX_BYTES) {
      setError("File must be under 8 MB.");
      return;
    }
    setError(null);
    setStep(0);
    const timers = [400, 1100, 1800].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms));
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/billing/digitize", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.draft) {
        setError(data.error ?? "Could not read this bill.");
        setStep(null);
        return;
      }
      setStep(3);
      onDraft(data.draft as DigitizerDraft);
      onClose();
    } catch {
      setError("Could not reach the digitizer.");
    } finally {
      timers.forEach((id) => window.clearTimeout(id));
      setStep(null);
    }
  }

  async function openCamera() {
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      setCameraOpen(true);
      return;
    }
    cameraFallbackRef.current?.click();
  }

  if (!open) return null;

  return (
    <>
      <div className="billing-no-print fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Add bill</div>
              <h3 className="text-lg font-semibold">Photograph or upload a paper bill</h3>
              <p className="mt-1 text-sm text-stone-500">AI reads customer, HUID, weights, making, and GST into this form.</p>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1 hover:bg-stone-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ActionCard icon={Camera} title="Take photo" hint="Live camera or back camera" onClick={() => void openCamera()} />
            <ActionCard icon={Images} title="Choose from gallery" hint="JPG, PNG, WebP" onClick={() => galleryRef.current?.click()} />
            <ActionCard icon={FileUp} title="Upload file" hint="Images or PDF" onClick={() => fileRef.current?.click()} />
          </div>

          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f); }} />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f); }} />
          <input ref={cameraFallbackRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f); }} />

          {step != null && (
            <div className="mt-5 rounded-xl border border-[#e7e1d8] bg-[#f4f1ea] p-4">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full bg-[#c9a227] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
              <ol className="space-y-1.5 text-sm">
                {STEPS.map((label, i) => (
                  <li key={label} className={i <= step ? "font-medium text-[#1c1917]" : "text-stone-400"}>
                    {i < step ? "✓" : i === step ? "…" : "○"} {label}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </div>
      </div>
      <CameraCaptureModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(file) => void send(file)} />
    </>
  );
}

function ActionCard({
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof Camera;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-[#e7e1d8] bg-[#fbfaf7] p-4 text-left transition hover:border-[#c9a227]">
      <Icon className="h-5 w-5 text-[#c9a227]" />
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-[12px] text-stone-500">{hint}</div>
    </button>
  );
}
