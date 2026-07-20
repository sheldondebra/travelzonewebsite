"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { getVerificationStatus, resendVerificationEmail, verifyEmailFromLink } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(Boolean(params.get("redirect")));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const redirect = params.get("redirect");
    if (redirect) {
      verifyEmailFromLink(redirect)
        .then(async (res) => {
          setVerified(res.verified);
          toast.success(res.message);
          await bootstrap();
        })
        .catch(() => toast.error("Verification link is invalid or expired."))
        .finally(() => setChecking(false));
      return;
    }

    getVerificationStatus()
      .then((status) => {
        if (status.verified) setVerified(true);
      })
      .catch(() => {
        /* not logged in */
      });
  }, [params, bootstrap]);

  async function handleResend() {
    setSending(true);
    try {
      const res = await resendVerificationEmail();
      toast.success(res.message);
    } catch {
      toast.error("Please log in first to resend verification email.");
      router.push("/auth/login");
    } finally {
      setSending(false);
    }
  }

  if (checking) {
    return <p className="mt-6 text-[14px] text-[#6B7280]">Verifying your email...</p>;
  }

  if (verified || user?.email_verified_at) {
    return (
      <div className="mt-6 rounded-[12px] border border-[#DCFCE7] bg-[#F0FDF4] p-6 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-[#22C55E]" />
        <h2 className="mt-3 text-[18px] font-bold text-[#002B7F]">Email Verified!</h2>
        <p className="mt-2 text-[14px] text-[#6B7280]">Your account is active. You can now access all features.</p>
        <Link href="/dashboard" className="ed-btn-primary mt-5 inline-flex">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="rounded-[12px] border border-[#E5EAF2] bg-[#EBF2FF] p-6 text-center">
        <Mail className="mx-auto h-12 w-12 text-[#0057FF]" />
        <h2 className="mt-3 text-[18px] font-bold text-[#002B7F]">Verify Your Email</h2>
        <p className="mt-2 text-[14px] text-[#6B7280]">
          We sent a verification link to{" "}
          <strong>{user?.email ?? "your email"}</strong>. Click the link in the email to activate your account.
        </p>
        <button type="button" onClick={() => void handleResend()} disabled={sending} className="ed-btn-primary mt-5">
          {sending ? "Sending..." : "Resend Verification Email"}
        </button>
        <p className="mt-4 text-[12px] text-[#9CA3AF]">
          Local dev: check <code className="rounded bg-white px-1">backend/storage/logs/laravel.log</code>
        </p>
      </div>
      <p className="mt-4 text-center text-[13px] text-[#6B7280]">
        Wrong account?{" "}
        <Link href="/auth/login" className="font-medium text-[#0057FF] hover:underline">
          Sign in with a different email
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthSplitLayout>
      <h1 className="text-[26px] font-bold text-[#002B7F]">Email Verification</h1>
      <Suspense fallback={<p className="mt-6 text-[14px] text-[#6B7280]">Loading...</p>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthSplitLayout>
  );
}
