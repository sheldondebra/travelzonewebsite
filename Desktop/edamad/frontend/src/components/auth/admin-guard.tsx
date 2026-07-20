"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthReady, useAuthStore } from "@/store/auth-store";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthReady();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/admin/dashboard",
      );
      router.replace(`/auth/login?redirect=${redirect}`);
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[14px] text-[#6B7280]">
        Loading admin dashboard...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
