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

  const session = await getSessionFromRequest(request);

  if (isAdminRoute && !isLogin && !isSetup && !isResetPassword) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if ((isLogin || isSetup) && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*"],
};
