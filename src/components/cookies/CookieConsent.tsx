"use client";

import { useState } from "react";
import Link from "next/link";
import {
  cookieCategories,
  defaultPreferences,
  type CookiePreferences,
} from "@/lib/cookies";
import { useCookies } from "@/components/cookies/CookieProvider";

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        disabled
          ? "cursor-not-allowed bg-brand-red/40"
          : checked
            ? "bg-brand-red"
            : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function CookiePreferencesPanel({
  initial,
  onSave,
  onAcceptAll,
  onClose,
}: {
  initial: CookiePreferences;
  onSave: (preferences: CookiePreferences) => void;
  onAcceptAll: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);

  return (
    <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">Cookie preferences</p>
          <p className="mt-1 text-xs text-text-muted">
            Choose which cookies Travel Zone may use.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-text-muted hover:text-navy"
          aria-label="Close preferences"
        >
          ✕
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {cookieCategories.map((category) => {
          const enabled = category.id === "necessary" ? true : draft[category.id];

          return (
            <li key={category.id} className="border border-gray-100 bg-cream/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-navy">{category.label}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                    {category.description}
                  </p>
                </div>
                <Toggle
                  label={`${category.label} cookies`}
                  checked={enabled}
                  disabled={category.required}
                  onChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      [category.id]: value,
                    }))
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="btn-primary px-4 py-2 text-xs"
        >
          Save preferences
        </button>
        <button
          type="button"
          onClick={onAcceptAll}
          className="border border-navy px-4 py-2 text-xs font-semibold text-navy hover:bg-navy hover:text-white"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}

export function CookieConsent() {
  const {
    showBanner,
    showPreferences,
    openPreferences,
    closePreferences,
    acceptAll,
    rejectAll,
    savePreferences,
    consent,
  } = useCookies();

  if (!showBanner) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-5"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="section-container">
        <div className="ml-auto max-w-lg border border-gray-200 bg-white shadow-xl sm:max-w-xl">
          {!showPreferences ? (
            <div className="p-4 sm:p-5">
              <p className="text-sm font-semibold text-navy">We use cookies</p>
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                We use cookies to run the site, remember your choices, and
                understand how our pages are used. You can accept all, reject
                non-essential cookies, or manage your preferences.{" "}
                <Link href="/cookies" className="font-medium text-brand-red hover:underline">
                  Cookie policy
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={acceptAll} className="btn-primary px-4 py-2 text-xs">
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="border border-navy px-4 py-2 text-xs font-semibold text-navy hover:bg-navy hover:text-white"
                >
                  Reject all
                </button>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="px-4 py-2 text-xs font-semibold text-brand-red hover:underline"
                >
                  Manage preferences
                </button>
              </div>
            </div>
          ) : (
            <CookiePreferencesPanel
              key={consent?.timestamp ?? "default"}
              initial={consent?.preferences ?? defaultPreferences}
              onSave={savePreferences}
              onAcceptAll={acceptAll}
              onClose={closePreferences}
            />
          )}
        </div>
      </div>
    </div>
  );
}
