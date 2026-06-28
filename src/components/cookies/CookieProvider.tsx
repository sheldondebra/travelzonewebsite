"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CookieConsent, CookiePreferences } from "@/lib/cookies";
import {
  acceptAllPreferences,
  defaultPreferences,
  readStoredConsent,
  saveConsent,
} from "@/lib/cookies";

type CookieContextValue = {
  consent: CookieConsent | null;
  hasAnswered: boolean;
  showBanner: boolean;
  showPreferences: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
};

const CookieContext = createContext<CookieContextValue | null>(null);

export function CookieProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(() => {
    const stored = readStoredConsent();
    return stored;
  });
  const [hasAnswered, setHasAnswered] = useState(() => Boolean(readStoredConsent()));
  const [showBanner, setShowBanner] = useState(() => !readStoredConsent());
  const [showPreferences, setShowPreferences] = useState(false);

  const persist = useCallback((preferences: CookiePreferences) => {
    const saved = saveConsent(preferences);
    setConsent(saved);
    setHasAnswered(true);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const value = useMemo<CookieContextValue>(
    () => ({
      consent,
      hasAnswered,
      showBanner,
      showPreferences,
      openPreferences: () => {
        setShowPreferences(true);
        setShowBanner(true);
      },
      closePreferences: () => {
        setShowPreferences(false);
        if (hasAnswered) setShowBanner(false);
      },
      acceptAll: () => persist(acceptAllPreferences),
      rejectAll: () => persist(defaultPreferences),
      savePreferences: persist,
    }),
    [consent, hasAnswered, showBanner, showPreferences, persist],
  );

  return <CookieContext.Provider value={value}>{children}</CookieContext.Provider>;
}

export function useCookies() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error("useCookies must be used within CookieProvider");
  }
  return context;
}
