import type { ShiftWindowState } from "@/lib/attendance/types";

export const ATTENDANCE_TZ = "Asia/Kolkata";

function partsOf(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ATTENDANCE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    date: `${bag.year}-${bag.month}-${bag.day}`,
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

export function attendanceToday() {
  return partsOf().date;
}

export function parseHm(value: string) {
  const [h, m] = value.split(":").map((bit) => Number(bit));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minutesNow() {
  const p = partsOf();
  return p.hour * 60 + p.minute;
}

export function slotLabel(start: string) {
  return `MORNING_SHIFT_${start.replace(":", "")}`;
}

export function classifyShiftWindow(input: {
  shiftStartTime: string;
  shiftEndTime: string;
  checkinGracePeriodMins: number;
  nowMinutes?: number;
}): { state: ShiftWindowState; canCheckIn: boolean; message: string } {
  const now = input.nowMinutes ?? minutesNow();
  const start = parseHm(input.shiftStartTime);
  const end = parseHm(input.shiftEndTime);
  const graceEnd = start + input.checkinGracePeriodMins;

  if (now < start) {
    return { state: "too_early", canCheckIn: false, message: "Shift has not started yet." };
  }
  if (now > end) {
    return { state: "too_late", canCheckIn: false, message: "Shift window has ended." };
  }
  if (now <= graceEnd) {
    return { state: "on_time", canCheckIn: true, message: "On-time check-in window." };
  }
  return { state: "late", canCheckIn: true, message: "Check-in will be marked LATE." };
}

export function countdownLabel(input: { shiftStartTime: string; shiftEndTime: string; checkinGracePeriodMins: number }) {
  const now = minutesNow();
  const start = parseHm(input.shiftStartTime);
  const end = parseHm(input.shiftEndTime);
  const graceEnd = start + input.checkinGracePeriodMins;
  const target = now < start ? start : now <= graceEnd ? graceEnd : end;
  const remaining = Math.max(0, target - now);
  const hours = Math.floor(remaining / 60);
  const mins = remaining % 60;
  if (now < start) return `Starts in ${hours}h ${mins}m`;
  if (now <= graceEnd) return `On-time window ends in ${hours}h ${mins}m`;
  if (now <= end) return `Shift ends in ${hours}h ${mins}m`;
  return "Shift ended";
}

export function statusForWindow(state: ShiftWindowState) {
  if (state === "on_time") return "PRESENT" as const;
  if (state === "late") return "LATE" as const;
  return null;
}
