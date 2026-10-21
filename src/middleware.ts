import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { canAccessPath, hasModuleAccess, isAppPath } from "@/lib/app-access";
import { canAccessAttendance } from "@/lib/attendance/roles";
import { postLoginPath, profileBySlug } from "@/lib/auth-profiles";

const { auth } = NextAuth(authConfig);
const PUBLIC = ["/login", "/api/auth"];

function continueWithPath(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const role = req.auth?.user?.role;

  if (!req.auth && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (req.auth && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = postLoginPath(role);
    return NextResponse.redirect(url);
  }

  if (role === "portal" && !pathname.startsWith("/portal") && !pathname.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (pathname === "/dashboard/attendance" || pathname.startsWith("/dashboard/attendance/")) {
    if (!canAccessAttendance(role)) {
      const url = req.nextUrl.clone();
      url.pathname = postLoginPath(role);
      return NextResponse.redirect(url);
    }
    return continueWithPath(req);
  }

  if (pathname.startsWith("/dashboard/")) {
    if (hasModuleAccess(role)) {
      const url = req.nextUrl.clone();
      url.pathname = postLoginPath(role);
      return NextResponse.redirect(url);
    }
    const slug = pathname.split("/")[2] ?? "";
    const profile = profileBySlug(slug);
    if (!profile || role !== profile.id) {
      const url = req.nextUrl.clone();
      url.pathname = postLoginPath(role);
      return NextResponse.redirect(url);
    }
  }

  if (role && isAppPath(pathname) && !canAccessPath(role, pathname) && role !== "portal") {
    const url = req.nextUrl.clone();
    url.pathname = postLoginPath(role);
    return NextResponse.redirect(url);
  }

  return continueWithPath(req);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
