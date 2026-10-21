import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "portal") redirect("/portal");
  const db = await getDb();
  const org = (await db.select().from(organizations).where(eq(organizations.id, session.user.organizationId)))[0];

  return (
    <div className="app-shell">
      <Sidebar orgName={org?.name ?? "Sarafa Books"} />
      <div className="app-content">
        <Topbar userName={session.user.name ?? "User"} role={session.user.role} />
        <main className="app-main sb-scroll">{children}</main>
      </div>
    </div>
  );
}
