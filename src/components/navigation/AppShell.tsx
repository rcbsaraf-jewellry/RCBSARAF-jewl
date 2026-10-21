"use client";

import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

export function AppShell({
  sidebar,
  topbar,
  banner,
  children,
  role,
  userName,
}: {
  sidebar: ReactNode;
  topbar: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  role?: string;
  userName?: string;
}) {
  return (
    <div className="app-shell">
      {sidebar}
      <div className="app-content">
        {banner}
        {topbar}
        <main className="app-main sb-scroll">{children}</main>
        <MobileBottomNav role={role} userName={userName} />
      </div>
    </div>
  );
}
