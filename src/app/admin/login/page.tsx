import { Logo } from "@/components/Logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
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

        <LoginForm />

        <p className="admin-login-nav">
          <Link href="/">&larr; Back to Travel Zone</Link>
        </p>
      </div>
    </div>
  );
}
