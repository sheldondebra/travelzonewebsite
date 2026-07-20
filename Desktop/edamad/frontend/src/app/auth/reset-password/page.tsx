"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { resetPassword } from "@/services/auth";

const schema = z
  .object({
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (!token || !email) {
      toast.error("Invalid reset link.");
      return;
    }
    try {
      const response = await resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setDone(true);
      toast.success(response.message);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      toast.error("Reset failed. The link may have expired.");
    }
  }

  if (!token || !email) {
    return (
      <div className="mt-6 text-[14px] text-[#6B7280]">
        Invalid or missing reset link.{" "}
        <Link href="/auth/forgot-password" className="font-medium text-[#0057FF] hover:underline">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-6 rounded-[12px] border border-[#DCFCE7] bg-[#F0FDF4] p-5 text-[14px] text-[#166534]">
        Password reset successfully. Redirecting to login...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <p className="text-[13px] text-[#6B7280]">Resetting password for <strong>{email}</strong></p>
      {(["password", "password_confirmation"] as const).map((field) => (
        <div key={field}>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">
            {field === "password" ? "New Password" : "Confirm New Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" />
            <input type="password" className="ed-input w-full pl-10" {...register(field)} />
          </div>
          {errors[field] && <p className="mt-1 text-xs text-[#EF4444]">{errors[field]?.message}</p>}
        </div>
      ))}
      <button type="submit" disabled={isSubmitting} className="ed-btn-primary w-full">
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout>
      <h1 className="text-[26px] font-bold text-[#002B7F]">Reset Password</h1>
      <p className="mt-1 text-[14px] text-[#6B7280]">Choose a strong new password for your account.</p>
      <Suspense fallback={<p className="mt-6 text-[14px] text-[#6B7280]">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
