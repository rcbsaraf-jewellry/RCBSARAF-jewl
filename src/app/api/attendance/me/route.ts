import { NextResponse } from "next/server";
import { closeEndedShifts, getOrCreateStaff, getTodayRecord, listHistory } from "@/lib/attendance/db";
import { requireAttendanceSession } from "@/lib/attendance/guard";
import { classifyShiftWindow, countdownLabel, slotLabel } from "@/lib/attendance/time-slot";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAttendanceSession();
  if (!session.ok) return session.response;

  const staff = await getOrCreateStaff(session.user.id, session.user.role);
  const closed = await closeEndedShifts(session.user.id, session.user.role);
  const today = closed ?? (await getTodayRecord(session.user.id));
  const window = classifyShiftWindow(staff);
  const history = await listHistory(session.user.id);
  const checkedIn = today?.verificationStatus === "PRESENT" || today?.verificationStatus === "LATE";

  return NextResponse.json({
    ok: true,
    name: session.user.name,
    role: session.user.role,
    staff: {
      shiftStartTime: staff.shiftStartTime,
      shiftEndTime: staff.shiftEndTime,
      checkinGracePeriodMins: staff.checkinGracePeriodMins,
      hasReference: Boolean(staff.referenceFaceUrl || staff.faceEmbedding),
    },
    window: {
      ...window,
      slotLabel: slotLabel(staff.shiftStartTime),
      countdownLabel: countdownLabel(staff),
    },
    today: today
      ? {
          status: today.verificationStatus,
          checkInTimestamp: today.checkInTimestamp,
          confidenceScore: today.confidenceScore,
          selfieImageUrl: today.selfieImageUrl,
        }
      : { status: "NOT_CHECKED_IN", checkInTimestamp: null, confidenceScore: null, selfieImageUrl: null },
    pending: window.canCheckIn && !checkedIn,
    history,
  });
}
