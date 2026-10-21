import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { logoutAction } from "@/server/actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "portal" && session.user.role !== "admin") redirect("/home");
  return (
    <div className="min-h-screen" style={{ background: "var(--page)" }}>
      <header className="app-topbar">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gold)] text-[10px] font-bold text-[#1c2530]">
            RCB
          </div>
          <span className="text-sm font-semibold">Customer Portal</span>
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <Link href="/portal" className="sb-link">
            Home
          </Link>
          <span>{session.user.name}</span>
          <form action={logoutAction}>
            <button className="sb-btn sb-btn-ghost sb-btn-sm">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
