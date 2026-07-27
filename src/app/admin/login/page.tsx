import { Logo } from "@/components/Logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getStaffUser } from "@/lib/auth/staff";
import { isDatabaseConfigured } from "@/lib/db/config";

type Props = {
  searchParams: Promise<{ reset?: string; error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  if (!isDatabaseConfigured()) {
    redirect("/admin/setup");
  }

  // Only redirect when the session maps to a real active staff user.
  const staff = await getStaffUser();
  if (staff) {
    redirect("/admin");
  }

  const params = await searchParams;
  const resetSuccess = params.reset === "success";
  const resetLinkError = params.error === "reset-link";

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

        {resetLinkError ? (
          <p className="admin-login-error mb-4" role="alert">
            <strong>Error:</strong> That reset link is invalid or has expired. Request a
            new one below.
          </p>
        ) : null}

        <LoginForm resetSuccess={resetSuccess} />

        <p className="admin-login-nav">
          <Link href="/">&larr; Back to Travel Zone</Link>
        </p>
      </div>
    </div>
  );
}
