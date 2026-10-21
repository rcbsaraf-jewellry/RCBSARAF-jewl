import { NextResponse } from "next/server";
import { matchStaffFace } from "@/lib/attendance/face-matcher";
import { closeEndedShifts, getOrCreateStaff, saveStaffReference, upsertTodayRecord } from "@/lib/attendance/db";
import { requireAttendanceSession } from "@/lib/attendance/guard";
import { classifyShiftWindow, slotLabel, statusForWindow } from "@/lib/attendance/time-slot";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await requireAttendanceSession();
  if (!session.ok) return session.response;

  let body: { userId?: string; selfieBase64?: string; embedding?: number[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const userId = session.user.id;
  if (body.userId && body.userId !== userId) {
    return NextResponse.json({ error: "You can only check in as yourself." }, { status: 403 });
  }
  const selfie = String(body.selfieBase64 ?? "");
  if (!selfie.startsWith("data:image/")) {
    return NextResponse.json({ error: "A live selfie is required." }, { status: 400 });
  }

  const staff = await getOrCreateStaff(userId, session.user.role);
  await closeEndedShifts(userId, session.user.role);
  const window = classifyShiftWindow(staff);
  if (!window.canCheckIn) {
    return NextResponse.json({ error: window.message, window: window.state }, { status: 409 });
  }

  const liveEmbedding = Array.isArray(body.embedding) ? body.embedding.filter((n) => Number.isFinite(n)) : null;

  try {
    const match = await matchStaffFace({
      referenceFaceUrl: staff.referenceFaceUrl,
      storedEmbedding: staff.faceEmbedding,
      selfieBase64: selfie,
      liveEmbedding,
    });

    if (!match.matched) {
      const record = await upsertTodayRecord({
        userId,
        role: session.user.role,
        status: "VERIFICATION_FAILED",
        selfieImageUrl: selfie,
        confidenceScore: match.confidence,
        timeSlot: slotLabel(staff.shiftStartTime),
      });
      return NextResponse.json(
        {
          ok: false,
          status: "VERIFICATION_FAILED",
          confidence: match.confidence,
          record,
          error: "Face does not match registered profile. Please try again.",
        },
        { status: 422 },
      );
    }

    if (match.enrolled) {
      await saveStaffReference(userId, selfie, liveEmbedding);
    }

    const status = statusForWindow(window.state) ?? "PRESENT";
    const record = await upsertTodayRecord({
      userId,
      role: session.user.role,
      status,
      selfieImageUrl: selfie,
      confidenceScore: match.confidence,
      timeSlot: slotLabel(staff.shiftStartTime),
      checkedIn: true,
    });

    return NextResponse.json({
      ok: true,
      status,
      confidence: match.confidence,
      enrolled: match.enrolled,
      record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Face verification failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
