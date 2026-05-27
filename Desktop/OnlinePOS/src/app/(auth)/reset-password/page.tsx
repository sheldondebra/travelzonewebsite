import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/ui/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
