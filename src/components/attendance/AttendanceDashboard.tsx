"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Camera, UserCheck } from "lucide-react";
import { SelfieCaptureModal } from "@/components/attendance/SelfieCaptureModal";
import { attendanceRoleCode } from "@/lib/attendance/roles";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/attendance/types";

type MeResponse = {
  name?: string;
  role: string;
  staff: {
    shiftStartTime: string;
    shiftEndTime: string;
    checkinGracePeriodMins: number;
    hasReference: boolean;
  };
  window: { state: string; canCheckIn: boolean; message: string; slotLabel: string; countdownLabel: string };
  today: { status: AttendanceStatus; checkInTimestamp: string | null; confidenceScore: number | null; selfieImageUrl: string | null };
  history: AttendanceRecord[];
};

const BADGE: Record<AttendanceStatus, string> = {
  NOT_CHECKED_IN: "bg-stone-200 text-stone-700",
  PRESENT: "bg-emerald-100 text-emerald-800",
  LATE: "bg-amber-100 text-amber-800",
  ABSENT: "bg-rose-100 text-rose-800",
  VERIFICATION_FAILED: "bg-rose-100 text-rose-800",
};

export function AttendanceDashboard({
  name,
  role,
  workspaceHref,
}: {
  name: string;
  role: string;
  workspaceHref: string;
}) {
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/me", { cache: "no-store" });
    const json = (await res.json()) as MeResponse & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Could not load attendance.");
      return;
    }
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
    const tick = window.setInterval(() => setNow(new Date()), 30000);
    const refresh = window.setInterval(() => void load(), 60000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, [load]);

  const todayStatus = data?.today.status ?? "NOT_CHECKED_IN";
  const canCapture = Boolean(data?.window.canCheckIn && todayStatus !== "PRESENT" && todayStatus !== "LATE");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href={workspaceHref} className="text-xs text-stone-500 hover:text-[#1c1917]">
        Back to workspace
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6d1a]">Attendance</div>
          <h1 className="text-2xl font-semibold">Selfie check-in</h1>
          <p className="text-sm text-stone-500">{format(now, "EEEE, d MMM yyyy")}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[todayStatus]}`}>
          {attendanceRoleCode(role)} · {todayStatus.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card label="Staff" value={data?.name ?? name} hint={`Shift ${data?.staff.shiftStartTime ?? "09:00"}–${data?.staff.shiftEndTime ?? "18:00"}`} />
        <Card label="Time slot" value={data?.window.slotLabel ?? "MORNING_SHIFT_0900"} hint={data?.window.countdownLabel ?? "—"} />
        <Card label="Today" value={todayStatus.replaceAll("_", " ")} hint={data?.today.checkInTimestamp ? format(new Date(data.today.checkInTimestamp), "hh:mm a") : "Not checked in"} />
      </div>

      <div className="mt-6 rounded-2xl border border-[#e7e1d8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="h-4 w-4 text-[#c9a227]" />
              {data?.staff.hasReference ? "Face on file" : "No reference photo yet"}
            </div>
            <p className="mt-1 text-sm text-stone-500">{data?.window.message ?? "Loading shift window…"}</p>
            {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          </div>
          <button
            type="button"
            disabled={!canCapture}
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#1c1917] disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {data?.staff.hasReference ? "Take selfie" : "Register face & check in"}
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e7e1d8] bg-white">
        <div className="border-b border-[#e7e1d8] px-4 py-3 text-sm font-semibold">Attendance history</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fbfaf7] text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Check-in</th>
              <th className="px-4 py-2">Selfie</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.history ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                  No attendance rows yet.
                </td>
              </tr>
            )}
            {(data?.history ?? []).map((row) => (
              <tr key={row.id} className="border-t border-[#f0ece4]">
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.checkInTimestamp ? format(new Date(row.checkInTimestamp), "hh:mm a") : "—"}</td>
                <td className="px-4 py-3">
                  {row.selfieImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.selfieImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[row.verificationStatus]}`}>
                    {row.verificationStatus.replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SelfieCaptureModal
        open={open}
        enroll={!data?.staff.hasReference}
        onClose={() => setOpen(false)}
        onVerified={() => {
          void load();
        }}
      />
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[#e7e1d8] bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <div className="mt-1 text-xs text-stone-500">{hint}</div>
    </div>
  );
}
