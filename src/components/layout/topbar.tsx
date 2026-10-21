"use client";

import { Bell, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/server/actions";
import { ROLES, type Role } from "@/lib/catalog";
import { canAccessPath } from "@/lib/app-access";
import { quickCreateForRole } from "@/lib/nav";

export function Topbar({ userName, role }: { userName: string; role: string }) {
  const roleLabel = role in ROLES ? ROLES[role as Role].label : role.replaceAll("_", " ");
  const createItems = quickCreateForRole(role);
  const canOpenSettings = canAccessPath(role, "/settings");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false);
        setMenu(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="app-topbar" ref={wrap}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search invoices, contacts, items"
          className="h-9 w-full max-w-[420px] rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12.5px] outline-none focus:border-[var(--gold)] focus:bg-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          {createItems.length > 0 && (
          <button type="button" onClick={() => { setOpen((v) => !v); setMenu(false); }} className="sb-btn sb-btn-gold">
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
          )}
          {open && createItems.length > 0 && (
            <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
              {createItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[12.5px] hover:bg-slate-50"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100" aria-label="Notifications">
          <Bell className="h-4 w-4 text-slate-500" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setMenu((v) => !v); setOpen(false); }}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1c2530] text-[11px] font-semibold text-white">
              {userName.slice(0, 1)}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-[12px] font-medium leading-tight">{userName}</div>
              <div className="text-[10px] text-slate-500">{roleLabel}</div>
            </div>
          </button>
          {menu && (
            <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
              {canOpenSettings && (
                <Link href="/settings" onClick={() => setMenu(false)} className="block px-3 py-2 text-[12.5px] hover:bg-slate-50">
                  Settings
                </Link>
              )}
              <form action={logoutAction}>
                <button type="submit" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-slate-50">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
