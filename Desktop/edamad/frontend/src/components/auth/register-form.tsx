"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/edamad/google-icon";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { authDesign, authInputClass, authPrimaryButtonClass } from "@/lib/auth-design";
import { register as registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().min(8, "Enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(8, "Confirm your password"),
    terms: z.boolean().refine((v) => v === true, { message: "You must accept the terms" }),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

const passwordInputClass = `${authInputClass} pr-10`;

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms: false },
  });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(data: FormData) {
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setUser(response.user);
      toast.success(response.message);
      router.push("/auth/verify-email");
    } catch {
      toast.error("Registration failed. Email may already be in use.");
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <h1 className="text-[28px] font-bold leading-tight" style={{ color: authDesign.primaryNavy }}>
        Create Your Account
      </h1>
      <p className="mt-2 text-[14px]" style={{ color: authDesign.muted }}>
        Sign up to start your learning journey with Ed-Amad.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
            Full Name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.75}
            />
            <input
              type="text"
              className={authInputClass}
              placeholder="Enter your full name"
              autoComplete="name"
              {...register("name")}
            />
          </div>
          {errors.name && <p className="mt-1 text-xs text-[#EF4444]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.75}
            />
            <input
              type="email"
              className={authInputClass}
              placeholder="Enter your email address"
              autoComplete="email"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-[#EF4444]">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
            Phone Number
          </label>
          <div className="relative">
            <Phone
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.75}
            />
            <input
              type="tel"
              className={authInputClass}
              placeholder="Enter your phone number"
              autoComplete="tel"
              {...register("phone")}
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-[#EF4444]">{errors.phone.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                strokeWidth={1.75}
              />
              <input
                type={showPassword ? "text" : "password"}
                className={passwordInputClass}
                placeholder="Create a password"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-[#EF4444]">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-bold" style={{ color: authDesign.primaryNavy }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                strokeWidth={1.75}
              />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={passwordInputClass}
                placeholder="Confirm your password"
                autoComplete="new-password"
                {...register("password_confirmation")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.password_confirmation.message}</p>
            )}
          </div>
        </div>

        <PasswordStrengthIndicator password={passwordValue} />

        <label className="flex cursor-pointer items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border-[#D1D5DB] accent-[#001E5A]"
            {...register("terms")}
          />
          <span className="text-[13px] leading-snug text-[#374151]">
            I agree to the{" "}
            <Link href="#" className="font-semibold hover:underline" style={{ color: authDesign.accentBlue }}>
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="#" className="font-semibold hover:underline" style={{ color: authDesign.accentBlue }}>
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.terms && <p className="text-xs text-[#EF4444]">{errors.terms.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${authPrimaryButtonClass} mt-1`}
          style={{ backgroundColor: authDesign.panelNavy }}
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[13px] text-[#9CA3AF]">or</span>
          </div>
        </div>

        <button
          type="button"
          className="flex h-[44px] w-full items-center justify-center gap-3 rounded-[8px] border border-[#D1D5DB] bg-white text-[14px] font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
        >
          <GoogleIcon className="h-5 w-5" />
          Continue with Google
        </button>
      </form>

      <p className="mt-8 text-center text-[14px]" style={{ color: authDesign.muted }}>
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: authDesign.accentBlue }}>
          Log In
        </Link>
      </p>
    </div>
  );
}
