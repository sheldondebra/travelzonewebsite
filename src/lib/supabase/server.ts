import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from Server Component — safe to ignore
        }
      },
    },
  });
}

export { isSupabaseConfigured };
