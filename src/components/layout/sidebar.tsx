"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { APP_NAV, BOTTOM_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of APP_NAV) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) next[item.label] = true;
    }
    setOpen((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  return (
    <aside className="app-sidebar">
      <div className="flex h-[52px] items-center gap-2.5 border-b border-white/10 px-3">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gold)] text-[11px] font-bold tracking-wide text-[#1c2530]">
          RCB
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">Sarafa Books</div>
          <div className="truncate text-[10px] text-[#93a0ae]">{orgName}</div>
        </div>
      </div>
      <nav className="sb-scroll flex-1 overflow-y-auto py-2">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.children
            ? item.children.some((c) => pathname.startsWith(c.href))
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          if (!item.children) {
            return (
              <Link key={item.href} href={item.href} className={cn("nav-link", active && "is-active")}>
                <Icon className="h-4 w-4 opacity-80" />
                {item.label}
              </Link>
            );
          }
          const expanded = open[item.label] ?? active;
          return (
            <div key={item.label} className="mb-0.5">
              <button
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [item.label]: !expanded }))}
                className={cn("nav-link w-[calc(100%-16px)] text-left", active && "text-white")}
              >
                <Icon className="h-4 w-4 opacity-80" />
                <span className="flex-1">{item.label}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition", expanded && "rotate-180")} />
              </button>
              {expanded && (
                <div className="mb-1 ml-5 border-l border-white/10">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn("nav-child", childActive && "is-active")}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 py-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("nav-link", active && "is-active")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
