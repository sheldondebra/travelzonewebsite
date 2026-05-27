import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/ui/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start selling with clarity">
      <RegisterForm />
    </AuthShell>
  );
}
