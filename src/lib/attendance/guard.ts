import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessAttendance } from "@/lib/attendance/roles";

export async function requireAttendanceSession() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (!canAccessAttendance(session.user.role)) {
    return { ok: false as const, response: NextResponse.json({ error: "Attendance is not enabled for this role." }, { status: 403 }) };
  }
  return { ok: true as const, user: session.user };
}
