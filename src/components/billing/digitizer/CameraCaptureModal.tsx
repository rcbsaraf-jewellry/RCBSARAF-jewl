"use client";

import { useEffect, useRef, useState } from "react";
import { Check, SwitchCamera, X, Zap } from "lucide-react";

export function CameraCaptureModal({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [torch, setTorch] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stop();
      setPreview(null);
      setBlob(null);
      setError(null);
      return;
    }
    void start(facing);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  async function start(mode: "environment" | "user") {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setError(null);
    } catch {
      setError("Camera permission was denied. Use Choose from Gallery instead.");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch(next);
    } catch {
      setError("Flash is not available on this camera.");
    }
  }

  function snapshot() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (next) => {
        if (!next) return;
        setBlob(next);
        setPreview(URL.createObjectURL(next));
      },
      "image/jpeg",
      0.92,
    );
  }

  function confirm() {
    if (!blob) return;
    onCapture(new File([blob], `bill-${Date.now()}.jpg`, { type: "image/jpeg" }));
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid h-[100dvh] w-[100dvw] place-items-stretch bg-black md:place-items-center md:bg-black/70 md:p-4">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#1c1917] text-white md:h-auto md:max-w-lg md:rounded-2xl md:shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">Take photo</div>
          <button type="button" aria-label="Close camera" onClick={onClose} className="rounded-md p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 bg-black md:aspect-[4/3] md:flex-none">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Bill preview" className="h-full w-full object-contain" />
          ) : (
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          )}
          {!preview && (
            <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-dashed border-[#c9a227]/80">
              <div className="absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-white" />
              <div className="absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-white" />
              <div className="absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-white" />
            </div>
          )}
        </div>
        {error && <p className="px-4 py-2 text-sm text-rose-300">{error}</p>}
        <div className="flex items-center justify-between gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {preview ? (
            <>
              <button type="button" onClick={() => { setPreview(null); setBlob(null); }} className="rounded-md px-3 py-2 text-sm">
                Retake
              </button>
              <button type="button" onClick={confirm} className="inline-flex items-center gap-2 rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1c1917]">
                <Check className="h-4 w-4" /> Use photo
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} className="rounded-md p-2 hover:bg-white/10">
                <SwitchCamera className="h-5 w-5" />
              </button>
              <button type="button" onClick={snapshot} className="h-14 w-14 rounded-full border-4 border-white bg-[#c9a227]" />
              <button type="button" onClick={() => void toggleTorch()} className={`rounded-md p-2 hover:bg-white/10 ${torch ? "text-[#c9a227]" : ""}`}>
                <Zap className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
