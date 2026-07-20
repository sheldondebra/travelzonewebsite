"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/edamad/google-icon";
import { authDesign, authInputClass } from "@/lib/auth-design";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { login } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = authInputClass;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: false },
  });

  async function onSubmit(data: FormData) {
    try {
      const response = await login(data.email, data.password, data.remember);
      setUser(response.user);
      toast.success(response.message);
      if (!response.user.email_verified_at && response.user.role !== "admin") {
        router.push("/auth/verify-email");
        return;
      }
      if (redirect && redirect.startsWith("/")) {
        router.push(redirect);
        return;
      }
      router.push(response.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Invalid email or password."));
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="text-[28px] font-bold leading-tight" style={{ color: authDesign.primaryNavy }}>
        Welcome Back!
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: authDesign.muted }}>
        Log in to continue your learning journey.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
            Email Address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" strokeWidth={1.75} />
            <input type="email" className={inputClass} placeholder="Enter your email address" {...register("email")} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-[#EF4444]">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-[12px] font-medium hover:underline" style={{ color: authDesign.accentBlue }}>
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" strokeWidth={1.75} />
            <input type={showPassword ? "text" : "password"} className={inputClass} placeholder="Enter your password" {...register("password")} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" className="h-4 w-4 rounded-[3px] border-[#D1D5DB] accent-[#001E5A]" {...register("remember")} />
          <span className="text-[13px] font-medium text-[#374151]">Remember me</span>
        </label>

        <button type="submit" disabled={isSubmitting} className="flex h-[44px] w-full items-center justify-center rounded-[8px] text-[15px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-70" style={{ backgroundColor: authDesign.panelNavy }}>
          {isSubmitting ? "Signing in..." : "Log In"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-4 text-[13px] text-[#9CA3AF]">or</span></div>
        </div>

        <button type="button" className="flex h-[44px] w-full items-center justify-center gap-3 rounded-[8px] border border-[#D1D5DB] bg-white text-[14px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]">
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>
      </form>

      <p className="mt-8 text-center text-[14px]" style={{ color: authDesign.muted }}>
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: authDesign.accentBlue }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
}
