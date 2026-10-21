import { NextResponse } from "next/server";
import { closeEndedShifts } from "@/lib/attendance/db";
import { requireAttendanceSession } from "@/lib/attendance/guard";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAttendanceSession();
  if (!session.ok) return session.response;
  const record = await closeEndedShifts(session.user.id, session.user.role);
  return NextResponse.json({ ok: true, record });
}
