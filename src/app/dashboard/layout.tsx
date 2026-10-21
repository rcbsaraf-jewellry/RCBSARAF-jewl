import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { postLoginPath, profileById } from "@/lib/auth-profiles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const profile = profileById(session.user.role);
  if (!profile) redirect(postLoginPath(session.user.role));

  return (
    <div className="auth-lux min-h-[100dvh] overflow-x-hidden text-[#1c1917]">
      <header className="flex h-14 items-center justify-between border-b border-[#e7e1d8] bg-[#fbfaf7] px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[#c9a227] text-[10px] font-bold text-zinc-950">
            RCB
          </div>
          <div>
            <div className="text-sm font-semibold">Sarafa Books</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{profile.label}</div>
          </div>
        </div>
        <div className="flex min-h-12 items-center gap-3 text-sm text-stone-500">
          <span className="hidden xs:inline">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">{children}</main>
      <MobileBottomNav role={session.user.role} userName={session.user.name ?? "User"} />
    </div>
  );
}
