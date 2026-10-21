"use client";

import Link from "next/link";
import { Drawer } from "vaul";
import { AUTH_PROFILES } from "@/lib/auth-profiles";
import { logoutAction } from "@/server/actions";

export function RoleSheet({
  open,
  onOpenChange,
  role,
  userName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: string;
  userName?: string;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] outline-none">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300" />
          <div className="px-5 py-4">
            <Drawer.Title className="text-base font-semibold">Profile</Drawer.Title>
            <p className="mt-1 text-sm text-stone-500">
              {userName ?? "Signed in"} · {role?.replaceAll("_", " ") ?? "role"}
            </p>
            <div className="mt-4 grid gap-2">
              {AUTH_PROFILES.map((profile) => (
                <Link
                  key={profile.id}
                  href="/login"
                  onClick={() => onOpenChange(false)}
                  className={`flex min-h-12 touch-manipulation items-center rounded-xl border px-3 py-2 text-left text-sm ${
                    profile.id === role ? "border-[#c9a227] bg-[#f8efd4]" : "border-[#e7e1d8] bg-white"
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{profile.label}</span>
                    <span className="text-[12px] text-stone-500">{profile.description}</span>
                  </span>
                </Link>
              ))}
            </div>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className="flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-stone-200 text-sm font-semibold">
                Sign out
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
