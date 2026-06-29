import { Logo } from "@/components/Logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function AdminResetPasswordPage() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?error=reset-link");
  }

  return (
    <div className="admin-login">
      <div className="admin-login-wrap">
        <div className="admin-login-logo">
          <Logo
            variant="color"
            size="xl"
            className="max-w-full"
            linkLabel="Travel Zone — back to site"
          />
        </div>

        <ResetPasswordForm />

        <p className="admin-login-nav">
          <Link href="/">&larr; Back to Travel Zone</Link>
        </p>
      </div>
    </div>
  );
}
