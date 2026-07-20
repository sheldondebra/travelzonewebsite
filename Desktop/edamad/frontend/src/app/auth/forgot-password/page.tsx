import { AuthBrandPanel } from "@/components/edamad/auth-brand-panel";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel />
      <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-white px-8 py-10 sm:px-14 md:max-w-[55%] md:flex-[0_0_55%] lg:px-20">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
