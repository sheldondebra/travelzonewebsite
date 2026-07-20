import { AuthBrandPanel } from "@/components/edamad/auth-brand-panel";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthBrandPanel />
      <div className="flex min-h-screen w-full flex-1 items-start justify-center overflow-y-auto bg-white px-8 py-10 sm:px-14 md:max-w-[55%] md:flex-[0_0_55%] lg:items-center lg:px-20">
        <RegisterForm />
      </div>
    </div>
  );
}
