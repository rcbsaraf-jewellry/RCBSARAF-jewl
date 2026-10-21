import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { AttendancePendingBanner } from "@/components/attendance/AttendancePendingBanner";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppShell } from "@/components/navigation/AppShell";
import { hasModuleAccess } from "@/lib/app-access";
import { postLoginPath } from "@/lib/auth-profiles";
import { getDb } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";

function SidebarFallback() {
  return <aside className="app-sidebar" />;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "portal") redirect("/portal");
  if (!hasModuleAccess(session.user.role)) redirect(postLoginPath(session.user.role));

  const db = await getDb();
  const org = (await db.select().from(organizations).where(eq(organizations.id, session.user.organizationId)))[0];
  const initialPath = (await headers()).get("x-pathname") || postLoginPath(session.user.role);

  return (
    <AppShell
      role={session.user.role}
      userName={session.user.name ?? "User"}
      banner={<AttendancePendingBanner role={session.user.role} />}
      sidebar={
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar orgName={org?.name ?? "Sarafa Books"} role={session.user.role} initialPath={initialPath} />
        </Suspense>
      }
      topbar={<Topbar userName={session.user.name ?? "User"} role={session.user.role} />}
    >
      {children}
    </AppShell>
  );
}
