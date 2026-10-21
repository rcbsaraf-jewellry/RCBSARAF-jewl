export const FULL_APP_ROLES = ["business_owner", "admin", "accountant"] as const;

export const APP_PATH_PREFIXES = [
  "/home",
  "/items",
  "/banking",
  "/sales",
  "/purchases",
  "/time",
  "/accountant",
  "/reports",
  "/documents",
  "/settings",
] as const;

export const ROLE_ALLOWED_PREFIXES: Record<string, readonly string[]> = {
  sales: ["/items", "/sales", "/dashboard/attendance"],
  store_manager: ["/items", "/sales", "/purchases", "/time", "/reports", "/dashboard/attendance"],
};

export function hasFullAppAccess(role: string | null | undefined) {
  return (FULL_APP_ROLES as readonly string[]).includes(role ?? "");
}

export function hasModuleAccess(role: string | null | undefined) {
  return hasFullAppAccess(role) || Boolean(ROLE_ALLOWED_PREFIXES[role ?? ""]?.length);
}

export function isAppPath(pathname: string) {
  return APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function canAccessPath(role: string | null | undefined, pathname: string) {
  if (hasFullAppAccess(role)) return true;
  const prefixes = ROLE_ALLOWED_PREFIXES[role ?? ""] ?? [];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
