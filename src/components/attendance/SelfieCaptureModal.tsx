"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, Check, X } from "lucide-react";
import { extractFaceDescriptor } from "@/components/attendance/face-embed";
import type { AttendanceStatus } from "@/lib/attendance/types";

function playTone(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ok ? 880 : 196;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    /* audio is optional */
  }
}

export function SelfieCaptureModal({
  open,
  enroll,
  onClose,
  onVerified,
}: {
  open: boolean;
  enroll: boolean;
  onClose: () => void;
  onVerified: (status: AttendanceStatus, confidence: number) => void;
}) {
  const cam = useRef<Webcam>(null);
  const [phase, setPhase] = useState<"live" | "matching" | "success" | "fail">("live");
  const [message, setMessage] = useState("Align your face in the oval.");
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");

  const submit = useCallback(async () => {
    const selfie = cam.current?.getScreenshot();
    if (!selfie) {
      setMessage("Camera is not ready yet.");
      return;
    }
    setPhase("matching");
    setMessage("Matching face against profile record...");
    const embedding = await extractFaceDescriptor(selfie);
    try {
      const res = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieBase64: selfie, embedding }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: AttendanceStatus;
        confidence?: number;
        enrolled?: boolean;
        error?: string;
      };
      if (!res.ok || data.status === "VERIFICATION_FAILED") {
        setPhase("fail");
        setMessage(data.error ?? "Face does not match registered profile. Please try again.");
        playTone(false);
        return;
      }
      const next = data.status ?? "PRESENT";
      setStatus(next);
      setPhase("success");
      setMessage(data.enrolled ? `Face registered. Status: ${next}` : `Status: ${next}`);
      playTone(true);
      onVerified(next, data.confidence ?? 1);
    } catch {
      setPhase("fail");
      setMessage("Could not reach attendance verification.");
      playTone(false);
    }
  }, [onVerified]);

  if (!open) return null;

  const ring =
    phase === "matching"
      ? "border-[#c9a227] animate-pulse"
      : phase === "success"
        ? "border-emerald-500"
        : phase === "fail"
          ? "border-rose-500"
          : "border-sky-400";

  return (
    <div className="fixed inset-0 z-50 grid h-[100dvh] w-[100dvw] place-items-stretch bg-black md:place-items-center md:bg-black/50 md:p-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white md:h-auto md:max-w-md md:rounded-2xl md:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Live selfie</div>
            <h3 className="text-base font-semibold">{enroll ? "Register your face" : "Capture & submit attendance"}</h3>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          <Webcam
            ref={cam}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.86}
            mirrored
            videoConstraints={{ facingMode: "user", width: 720, height: 720 }}
            className="h-full w-full object-cover md:aspect-square md:h-auto"
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className={`h-[58%] w-[68%] max-w-[280px] rounded-full border-4 ${ring} shadow-[0_0_0_999px_rgba(0,0,0,.35)] md:h-[70%] md:w-[52%]`} />
          </div>
          {phase === "success" && (
            <div className="absolute inset-0 grid place-items-center bg-emerald-700/70 text-white">
              <div className="grid place-items-center gap-2">
                <Check className="h-12 w-12" />
                <div className="text-lg font-semibold">{status}</div>
              </div>
            </div>
          )}
          {phase === "fail" && (
            <div className="absolute inset-x-0 bottom-0 bg-rose-700/90 px-4 py-3 text-center text-sm text-white">
              Face does not match registered profile. Please try again.
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <p className="text-sm text-stone-600">{message}</p>
          {phase === "fail" ? (
            <button type="button" onClick={() => { setPhase("live"); setMessage("Align your face in the oval."); }} className="w-full rounded-md bg-rose-600 py-2.5 text-sm font-semibold text-white">
              Retry selfie
            </button>
          ) : phase === "success" ? (
            <button type="button" onClick={onClose} className="w-full rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white">
              Done
            </button>
          ) : (
            <button
              type="button"
              disabled={phase === "matching"}
              onClick={() => void submit()}
                  className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-md bg-[#c9a227] py-2.5 text-sm font-semibold text-[#1c1917] disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {phase === "matching" ? "Matching…" : "Capture & Submit Attendance"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
