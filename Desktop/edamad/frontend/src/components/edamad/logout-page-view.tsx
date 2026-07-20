"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  Clock,
  Headphones,
  Lock,
  LogOut,
  Shield,
} from "lucide-react";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

const infoItems = [
  {
    icon: Shield,
    iconColor: "#0057FF",
    bg: "#EBF2FF",
    title: "Before you go",
    text: "Please review the information below.",
  },
  {
    icon: Clock,
    iconColor: "#8B5CF6",
    bg: "#F3E8FF",
    title: "Your progress is saved",
    text: "All your learning progress will be saved and available when you log in again.",
  },
  {
    icon: Bookmark,
    iconColor: "#22C55E",
    bg: "#DCFCE7",
    title: "You can log in anytime",
    text: "Continue learning anytime by signing in with your account.",
  },
  {
    icon: Lock,
    iconColor: "#F59E0B",
    bg: "#FFEDD5",
    title: "Secure & private",
    text: "For your security, please make sure to log out when using a shared device.",
  },
];

function LogoutIllustration() {
  return (
    <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#EDE9FE]">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
        <rect x="14" y="10" width="30" height="52" rx="3" fill="#0057FF" />
        <rect x="18" y="14" width="22" height="44" rx="2" fill="#0046CC" />
        <circle cx="36" cy="36" r="2.5" fill="#93C5FD" />
        <path
          d="M44 36H62M62 36L56 30M62 36L56 42"
          stroke="#0057FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M44 22V50" stroke="#0057FF" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    </div>
  );
}

export function LogoutPageView() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } catch {
      /* proceed even if API unreachable */
    }
    clearAuth();
    router.push("/auth/login");
  }

  function handleCancel() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="py-4">
      <div className="mx-auto max-w-[480px]">
        <div className="ed-card px-6 py-8 text-center">
          <LogoutIllustration />
          <h1 className="text-[24px] font-bold text-[#002B7F]">Ready to Log Out?</h1>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            You will be securely logged out of your account.
          </p>

          <div className="mt-8 space-y-4 text-left">
            {infoItems.map(({ icon: Icon, iconColor, bg, title, text }) => (
              <div key={title} className="flex gap-3 rounded-[10px] border border-[#E5EAF2] p-3.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: iconColor }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#002B7F]">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#6B7280]">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleLogout()}
              className="ed-btn-primary w-full gap-2 disabled:opacity-70"
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Logging out..." : "Yes, Log Out"}
            </button>
            <button type="button" onClick={handleCancel} className="ed-btn-outline w-full">
              Cancel, Stay Logged In
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-[960px] flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#EBF2FF] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0057FF]/10">
            <Shield className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#002B7F]">Need help?</p>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">
              If you&apos;re having any issues logging out, please contact our support team.
            </p>
          </div>
        </div>
        <Link href="/support" className="ed-btn-outline shrink-0 gap-2 bg-white text-[13px]">
          <Headphones className="h-4 w-4" />
          Contact Support
        </Link>
      </div>
    </div>
  );
}
