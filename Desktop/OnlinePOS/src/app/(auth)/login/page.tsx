import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/ui/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your shop dashboard">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
