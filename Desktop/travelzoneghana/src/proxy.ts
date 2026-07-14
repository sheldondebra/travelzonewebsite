import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";
  const isSetup = pathname === "/admin/setup";

  const env = getSupabaseEnv();
  if (!env) {
    if (isAdminRoute && !isLogin && !isSetup) {
      return NextResponse.redirect(new URL("/admin/setup", request.url));
    }
    return NextResponse.next({ request });
  }

  const { supabase, response } = createClient(request);
  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute && !isLogin && !isSetup) {
    const role = user?.app_metadata?.role;
    if (!user || (role !== "admin" && role !== "editor")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if ((isLogin || isSetup) && user?.app_metadata?.role) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
