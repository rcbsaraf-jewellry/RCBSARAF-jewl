import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AttendanceDashboard } from "@/components/attendance/AttendanceDashboard";
import { canAccessAttendance } from "@/lib/attendance/roles";
import { postLoginPath } from "@/lib/auth-profiles";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessAttendance(session.user.role)) redirect(postLoginPath(session.user.role));

  return (
    <AttendanceDashboard
      name={session.user.name ?? "Staff"}
      role={session.user.role}
      workspaceHref={postLoginPath(session.user.role)}
    />
  );
}
