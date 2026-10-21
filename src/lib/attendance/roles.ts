export const ATTENDANCE_ROLES = ["sales", "store_manager", "staff", "business_owner", "admin"] as const;

export type AttendanceRole = (typeof ATTENDANCE_ROLES)[number];

export function canAccessAttendance(role?: string | null) {
  return ATTENDANCE_ROLES.includes((role ?? "") as AttendanceRole);
}

export function attendanceRoleCode(role: string) {
  if (role === "sales") return "SALES";
  if (role === "store_manager") return "STORE_MANAGER";
  if (role === "staff") return "STAFF";
  return role.replaceAll("-", "_").toUpperCase();
}
