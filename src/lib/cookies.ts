export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_KEY = "tz-cookie-consent";
export const COOKIE_CONSENT_COOKIE = "tz_cookie_consent";

export type CookieCategory = "necessary" | "functional" | "analytics" | "marketing";

export type CookiePreferences = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsent = {
  version: number;
  preferences: CookiePreferences;
  timestamp: string;
};

export const cookieCategories: Array<{
  id: CookieCategory;
  label: string;
  description: string;
  required?: boolean;
}> = [
  {
    id: "necessary",
    label: "Strictly necessary",
    description:
      "Required for the site to work — security, session management, booking flow, and remembering your cookie choice.",
    required: true,
  },
  {
    id: "functional",
    label: "Functional",
    description:
      "Remembers preferences such as form inputs and display settings to improve your experience.",
  },
  {
    id: "analytics",
    label: "Analytics",
    description:
      "Helps us understand how visitors use the site so we can improve pages and content.",
  },
  {
    id: "marketing",
    label: "Marketing",
    description:
      "Used to measure campaigns and show relevant travel offers on other platforms.",
  },
];

export const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const acceptAllPreferences: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
};

export function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== COOKIE_CONSENT_VERSION || !parsed.preferences) {
      return null;
    }
    return {
      version: COOKIE_CONSENT_VERSION,
      preferences: {
        necessary: true,
        functional: Boolean(parsed.preferences.functional),
        analytics: Boolean(parsed.preferences.analytics),
        marketing: Boolean(parsed.preferences.marketing),
      },
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveConsent(preferences: CookiePreferences): CookieConsent {
  const consent: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    preferences: { ...preferences, necessary: true },
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))};path=/;max-age=31536000;SameSite=Lax`;
    window.dispatchEvent(
      new CustomEvent("tz-cookie-consent", { detail: consent }),
    );
  }

  return consent;
}

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  return parseConsent(localStorage.getItem(COOKIE_CONSENT_KEY));
}

export function hasConsent(category: CookieCategory, consent: CookieConsent | null) {
  if (!consent) return category === "necessary";
  if (category === "necessary") return true;
  return consent.preferences[category];
}
