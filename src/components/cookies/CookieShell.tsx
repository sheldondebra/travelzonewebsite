"use client";

import dynamic from "next/dynamic";
import { CookieProvider } from "@/components/cookies/CookieProvider";

const CookieConsent = dynamic(
  () =>
    import("@/components/cookies/CookieConsent").then((module) => module.CookieConsent),
  { ssr: false },
);

const WhatsAppFab = dynamic(
  () => import("@/components/WhatsAppFab").then((module) => module.WhatsAppFab),
  { ssr: false },
);

export function CookieShell({ children }: { children: React.ReactNode }) {
  return (
    <CookieProvider>
      {children}
      <WhatsAppFab />
      <CookieConsent />
    </CookieProvider>
  );
}
