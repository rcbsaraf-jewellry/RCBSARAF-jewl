export const ATTENDANCE_STATUSES = ["NOT_CHECKED_IN", "PRESENT", "LATE", "ABSENT", "VERIFICATION_FAILED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type ShiftWindowState = "too_early" | "on_time" | "late" | "too_late";

export type AttendanceStaff = {
  userId: string;
  role: string;
  referenceFaceUrl: string | null;
  faceEmbedding: number[] | null;
  shiftStartTime: string;
  shiftEndTime: string;
  checkinGracePeriodMins: number;
};

export type AttendanceRecord = {
  id: string;
  userId: string;
  role: string;
  date: string;
  checkInTimestamp: string | null;
  selfieImageUrl: string | null;
  verificationStatus: AttendanceStatus;
  confidenceScore: number | null;
  timeSlot: string | null;
  createdAt: string;
};
