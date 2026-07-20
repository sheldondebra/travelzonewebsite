import { AuthBrandPanel } from "@/components/edamad/auth-brand-panel";
import { LoginForm } from "@/components/auth/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel />
      <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-white px-8 py-10 md:flex-[0_0_55%] md:max-w-[55%] sm:px-14 lg:px-20">
        <Suspense fallback={<div className="text-[14px] text-[#6B7280]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
