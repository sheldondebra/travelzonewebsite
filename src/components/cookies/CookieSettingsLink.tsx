"use client";

import { useCookies } from "@/components/cookies/CookieProvider";

export function CookieSettingsLink({
  className = "",
}: {
  className?: string;
}) {
  const { openPreferences } = useCookies();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={`text-left transition-colors hover:text-white ${className}`}
    >
      Cookie settings
    </button>
  );
}
