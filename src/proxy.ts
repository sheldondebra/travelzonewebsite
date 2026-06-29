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
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.is_active
      ? profile.role
      : user.app_metadata?.role;

    if (role !== "admin" && role !== "editor") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (profile && !profile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if ((isLogin || isSetup) && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.is_active
      ? profile.role
      : user.app_metadata?.role;

    if (role === "admin" || role === "editor") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
