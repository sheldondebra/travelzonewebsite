"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasAnswered(true);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
    setReady(true);
  }, []);

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
      showBanner: ready && showBanner,
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
    [consent, hasAnswered, ready, showBanner, showPreferences, persist],
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
