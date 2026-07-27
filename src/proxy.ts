import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/config";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";
  const isSetup = pathname === "/admin/setup";
  const isResetPassword = pathname === "/admin/reset-password";

  if (!isDatabaseConfigured()) {
    if (isAdminRoute && !isLogin && !isSetup) {
      return NextResponse.redirect(new URL("/admin/setup", request.url));
    }
    return NextResponse.next({ request });
  }

  // Public auth pages — do not bounce based on JWT alone (cookie may be stale).
  if (isLogin || isSetup || isResetPassword) {
    return NextResponse.next({ request });
  }

  if (isAdminRoute) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
