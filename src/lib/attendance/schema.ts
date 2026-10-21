import { index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const attendanceStaff = pgTable("attendance_staff", {
  userId: text("user_id").primaryKey(),
  role: text("role").notNull(),
  referenceFaceUrl: text("reference_face_url"),
  faceEmbedding: text("face_embedding"),
  shiftStartTime: text("shift_start_time").notNull().default("09:00"),
  shiftEndTime: text("shift_end_time").notNull().default("18:00"),
  checkinGracePeriodMins: integer("checkin_grace_period_mins").notNull().default(30),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    date: text("date").notNull(),
    checkInTimestamp: timestamp("check_in_timestamp", { withTimezone: true }),
    selfieImageUrl: text("selfie_image_url"),
    verificationStatus: text("verification_status").notNull(),
    confidenceScore: numeric("confidence_score", { precision: 6, scale: 4 }),
    timeSlot: text("time_slot"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("attendance_records_user_date_idx").on(t.userId, t.date),
    index("attendance_records_user_idx").on(t.userId),
    index("attendance_records_date_idx").on(t.date),
  ],
);
