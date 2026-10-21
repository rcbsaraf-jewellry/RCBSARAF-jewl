"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { canAccessAttendance } from "@/lib/attendance/roles";

export function AttendancePendingBanner({ role }: { role?: string }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!canAccessAttendance(role) || pathname?.startsWith("/dashboard/attendance")) {
      setPending(false);
      return;
    }
    let cancelled = false;
    void fetch("/api/attendance/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { pending?: boolean }) => {
        if (!cancelled) setPending(Boolean(data.pending));
      })
      .catch(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, pathname]);

  if (!pending) return null;

  return (
    <Link
      href="/dashboard/attendance"
      className="flex items-center justify-center gap-2 bg-[#c9a227] px-4 py-2 text-[12.5px] font-semibold text-[#1c1917]"
    >
      <Camera className="h-3.5 w-3.5" />
      Attendance Pending: Click here to take selfie and mark present.
    </Link>
  );
}
