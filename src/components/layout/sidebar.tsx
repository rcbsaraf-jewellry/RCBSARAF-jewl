"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ROLES, type Role } from "@/lib/catalog";
import { bottomNavForRole, navForRole, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

function pathMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function openFromPath(pathname: string, items: NavItem[]) {
  const next: Record<string, boolean> = {};
  for (const item of items) {
    if (item.children?.some((child) => pathMatches(pathname, child.href))) {
      next[item.label] = true;
    }
  }
  return next;
}

export function Sidebar({
  orgName,
  role,
  initialPath,
}: {
  orgName: string;
  role?: string;
  initialPath: string;
}) {
  const roleLabel = role && role in ROLES ? ROLES[role as Role].label : null;
  const clientPath = usePathname();
  const [pathname, setPathname] = useState(initialPath);
  const nav = useMemo(() => navForRole(role), [role]);
  const bottomNav = useMemo(() => bottomNavForRole(role), [role]);
  const [open, setOpen] = useState(() => openFromPath(initialPath, navForRole(role)));

  useEffect(() => {
    if (clientPath && clientPath !== pathname) setPathname(clientPath);
  }, [clientPath, pathname]);

  useEffect(() => {
    setOpen((prev) => ({ ...prev, ...openFromPath(pathname, nav) }));
  }, [pathname, nav]);

  return (
    <aside className="app-sidebar">
      <div className="flex h-[52px] items-center gap-2.5 border-b border-white/10 px-3">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--gold)] text-[11px] font-bold tracking-wide text-[#1c2530]">
          RCB
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-white">Sarafa Books</div>
          <div className="truncate text-[10px] text-[#93a0ae]">
            {orgName}
            {roleLabel ? ` · ${roleLabel}` : ""}
          </div>
        </div>
      </div>
      <nav className="sb-scroll flex-1 overflow-y-auto py-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.children
            ? item.children.some((child) => pathMatches(pathname, child.href))
            : pathMatches(pathname, item.href);
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
                    const childActive = pathMatches(pathname, child.href);
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
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = pathMatches(pathname, item.href);
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
