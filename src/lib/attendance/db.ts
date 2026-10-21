import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { nid } from "@/lib/utils";
import { attendanceRoleCode } from "@/lib/attendance/roles";
import { attendanceRecords, attendanceStaff } from "@/lib/attendance/schema";
import { ATTENDANCE_SCHEMA_SQL } from "@/lib/attendance/sql";
import { attendanceToday, classifyShiftWindow, slotLabel } from "@/lib/attendance/time-slot";
import type { AttendanceRecord, AttendanceStaff, AttendanceStatus } from "@/lib/attendance/types";

const globalForAttendance = globalThis as unknown as { sarafaAttendanceReady?: Promise<void> };

const DEFAULT_SHIFTS: Array<{ userId: string; role: string }> = [
  { userId: "user_sales", role: "sales" },
  { userId: "user_store", role: "store_manager" },
  { userId: "user_owner", role: "business_owner" },
];

async function runStatements() {
  const db = await getDb();
  const statements = ATTENDANCE_SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
  for (const row of DEFAULT_SHIFTS) {
    const existing = await db.select({ userId: attendanceStaff.userId }).from(attendanceStaff).where(eq(attendanceStaff.userId, row.userId)).limit(1);
    if (existing.length) continue;
    await db.insert(attendanceStaff).values({
      userId: row.userId,
      role: attendanceRoleCode(row.role),
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      checkinGracePeriodMins: 30,
    });
  }
}

export async function ensureAttendanceSchema() {
  if (!globalForAttendance.sarafaAttendanceReady) {
    globalForAttendance.sarafaAttendanceReady = runStatements().catch((error) => {
      globalForAttendance.sarafaAttendanceReady = undefined;
      throw error;
    });
  }
  await globalForAttendance.sarafaAttendanceReady;
}

function parseEmbedding(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as number[];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isFinite(n)) : null;
  } catch {
    return null;
  }
}

function mapStaff(row: typeof attendanceStaff.$inferSelect): AttendanceStaff {
  return {
    userId: row.userId,
    role: row.role,
    referenceFaceUrl: row.referenceFaceUrl,
    faceEmbedding: parseEmbedding(row.faceEmbedding),
    shiftStartTime: row.shiftStartTime,
    shiftEndTime: row.shiftEndTime,
    checkinGracePeriodMins: row.checkinGracePeriodMins,
  };
}

function mapRecord(row: typeof attendanceRecords.$inferSelect): AttendanceRecord {
  return {
    id: row.id,
    userId: row.userId,
    role: row.role,
    date: row.date,
    checkInTimestamp: row.checkInTimestamp instanceof Date ? row.checkInTimestamp.toISOString() : row.checkInTimestamp,
    selfieImageUrl: row.selfieImageUrl,
    verificationStatus: row.verificationStatus as AttendanceStatus,
    confidenceScore: row.confidenceScore == null ? null : Number(row.confidenceScore),
    timeSlot: row.timeSlot,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function getOrCreateStaff(userId: string, role: string) {
  await ensureAttendanceSchema();
  const db = await getDb();
  const existing = (await db.select().from(attendanceStaff).where(eq(attendanceStaff.userId, userId)).limit(1))[0];
  if (existing) return mapStaff(existing);
  await db.insert(attendanceStaff).values({
    userId,
    role: attendanceRoleCode(role),
    shiftStartTime: "09:00",
    shiftEndTime: "18:00",
    checkinGracePeriodMins: 30,
  });
  const created = (await db.select().from(attendanceStaff).where(eq(attendanceStaff.userId, userId)).limit(1))[0];
  if (!created) throw new Error("Could not create attendance profile.");
  return mapStaff(created);
}

export async function saveStaffReference(userId: string, referenceFaceUrl: string, embedding: number[] | null) {
  await ensureAttendanceSchema();
  const db = await getDb();
  await db
    .update(attendanceStaff)
    .set({
      referenceFaceUrl,
      faceEmbedding: embedding ? JSON.stringify(embedding) : null,
    })
    .where(eq(attendanceStaff.userId, userId));
}

export async function getTodayRecord(userId: string) {
  await ensureAttendanceSchema();
  const db = await getDb();
  const date = attendanceToday();
  const row = (await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.userId, userId), eq(attendanceRecords.date, date))).limit(1))[0];
  return row ? mapRecord(row) : null;
}

export async function listHistory(userId: string, limit = 14) {
  await ensureAttendanceSchema();
  const db = await getDb();
  const rows = await db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, userId)).orderBy(desc(attendanceRecords.date)).limit(limit);
  return rows.map(mapRecord);
}

export async function upsertTodayRecord(input: {
  userId: string;
  role: string;
  status: AttendanceStatus;
  selfieImageUrl?: string | null;
  confidenceScore?: number | null;
  timeSlot?: string | null;
  checkedIn?: boolean;
}) {
  await ensureAttendanceSchema();
  const db = await getDb();
  const date = attendanceToday();
  const existing = (await db.select().from(attendanceRecords).where(and(eq(attendanceRecords.userId, input.userId), eq(attendanceRecords.date, date))).limit(1))[0];
  const values = {
    role: attendanceRoleCode(input.role),
    verificationStatus: input.status,
    selfieImageUrl: input.selfieImageUrl ?? existing?.selfieImageUrl ?? null,
    confidenceScore: input.confidenceScore == null ? null : String(input.confidenceScore),
    timeSlot: input.timeSlot ?? existing?.timeSlot ?? slotLabel("09:00"),
    checkInTimestamp: input.checkedIn ? new Date() : existing?.checkInTimestamp ?? null,
  };
  if (existing) {
    await db.update(attendanceRecords).set(values).where(eq(attendanceRecords.id, existing.id));
    const row = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, existing.id)).limit(1))[0];
    return mapRecord(row);
  }
  const id = nid();
  await db.insert(attendanceRecords).values({
    id,
    userId: input.userId,
    date,
    ...values,
  });
  const row = (await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).limit(1))[0];
  return mapRecord(row);
}

export async function closeEndedShifts(userId: string, role: string) {
  const staff = await getOrCreateStaff(userId, role);
  const window = classifyShiftWindow(staff);
  const today = await getTodayRecord(userId);
  if (window.state !== "too_late") return today;
  if (today && (today.verificationStatus === "PRESENT" || today.verificationStatus === "LATE")) return today;
  return upsertTodayRecord({
    userId,
    role,
    status: "ABSENT",
    timeSlot: slotLabel(staff.shiftStartTime),
  });
}
