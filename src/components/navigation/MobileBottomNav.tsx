"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Camera, Home, Receipt, ScanLine, UserRound } from "lucide-react";
import { canAccessAttendance } from "@/lib/attendance/roles";
import { canAccessPath, hasFullAppAccess } from "@/lib/app-access";
import { postLoginPath } from "@/lib/auth-profiles";
import { RoleSheet } from "@/components/navigation/RoleSheet";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ role, userName }: { role?: string; userName?: string }) {
  const pathname = usePathname() ?? "";
  const [profileOpen, setProfileOpen] = useState(false);
  const home = hasFullAppAccess(role) ? "/home" : postLoginPath(role);
  const canBilling = role === "billing" || hasFullAppAccess(role);
  const canAttend = canAccessAttendance(role);
  const canSales = canAccessPath(role, "/sales");

  const tabs = [
    { href: home, label: "Home", icon: Home, show: true },
    { href: canBilling ? "/dashboard/billing" : canSales ? "/sales/invoices" : home, label: canBilling ? "Billing" : "Sales", icon: Receipt, show: canBilling || canSales },
    { href: "/dashboard/attendance", label: "Attendance", icon: Camera, show: canAttend },
    { href: canBilling ? "/dashboard/billing/standard" : "/dashboard/attendance", label: "Scan", icon: ScanLine, show: canBilling || canAttend },
  ].filter((tab) => tab.show);

  return (
    <>
      <nav className="mobile-bottom-nav md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e7e1d8] bg-[#fbfaf7] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {tabs.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={`${tab.label}-${tab.href}`}
                href={tab.href}
                className={cn(
                  "flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-semibold",
                  active ? "text-[#8a6d1a]" : "text-stone-500",
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-stone-500"
          >
            <UserRound className="h-5 w-5" />
            Profile
          </button>
        </div>
      </nav>
      <RoleSheet open={profileOpen} onOpenChange={setProfileOpen} role={role} userName={userName} />
    </>
  );
}
