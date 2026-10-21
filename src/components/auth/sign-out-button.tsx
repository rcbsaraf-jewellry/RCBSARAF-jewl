"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-[#e7e1d8] bg-white px-3 py-1.5 text-[#1c1917] hover:bg-[#f4f1ea]"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign out
    </button>
  );
}
