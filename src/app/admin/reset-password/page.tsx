import { Logo } from "@/components/Logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { isDatabaseConfigured } from "@/lib/db/config";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AdminResetPasswordPage({ searchParams }: Props) {
  if (!isDatabaseConfigured()) {
    redirect("/admin/setup");
  }

  const { token } = await searchParams;
  if (!token?.trim()) {
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

        <ResetPasswordForm token={token} />

        <p className="admin-login-nav">
          <Link href="/">&larr; Back to Travel Zone</Link>
        </p>
      </div>
    </div>
  );
}
