"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { authDesign, authInputClass, authPrimaryButtonClass } from "@/lib/auth-design";
import { forgotPassword } from "@/services/auth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const response = await forgotPassword(data.email);
      setSentEmail(data.email);
      toast.success(response.message);
    } catch {
      toast.error("Unable to send reset link. Please try again.");
    }
  }

  function handleTryAgain() {
    setSentEmail(null);
    reset();
  }

  return (
    <div className="w-full max-w-[420px]">
      <Link
        href="/auth/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:underline"
        style={{ color: authDesign.accentBlue }}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to login
      </Link>

      {sentEmail ? (
        <div>
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EBF2FF" }}
          >
            <MailCheck className="h-7 w-7" style={{ color: authDesign.accentBlue }} strokeWidth={1.75} />
          </div>
          <h1 className="text-[28px] font-bold leading-tight" style={{ color: authDesign.primaryNavy }}>
            Check your inbox
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: authDesign.muted }}>
            If an account exists for{" "}
            <span className="font-semibold text-[#374151]">{sentEmail}</span>, we&apos;ve sent a password
            reset link. The link expires after 60 minutes.
          </p>

          <div className="mt-6 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[13px] leading-relaxed text-[#6B7280]">
            Didn&apos;t receive the email? Check your spam folder or try again with a different address.
          </div>

          <Link
            href="/auth/login"
            className={`${authPrimaryButtonClass} mt-6`}
            style={{ backgroundColor: authDesign.panelNavy }}
          >
            Back to Log In
          </Link>

          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-4 w-full text-center text-[14px] font-medium hover:underline"
            style={{ color: authDesign.accentBlue }}
          >
            Send another link
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-[28px] font-bold leading-tight" style={{ color: authDesign.primaryNavy }}>
            Forgot Password?
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: authDesign.muted }}>
            No worries — enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label
                className="mb-2 block text-[13px] font-bold"
                style={{ color: authDesign.primaryNavy }}
              >
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

            <button
              type="submit"
              disabled={isSubmitting}
              className={authPrimaryButtonClass}
              style={{ backgroundColor: authDesign.panelNavy }}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-8 text-center text-[14px]" style={{ color: authDesign.muted }}>
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: authDesign.accentBlue }}
            >
              Log In
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
