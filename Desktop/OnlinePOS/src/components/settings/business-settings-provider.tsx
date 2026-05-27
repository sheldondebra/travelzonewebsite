"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useSettingsData } from "@/components/settings/settings-shell";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  type BusinessSettings,
} from "@/lib/settings/defaults";
import { formatCurrency } from "@/lib/settings/helpers";

type BusinessSettingsContextValue = {
  settings: BusinessSettings;
  businessName: string;
  subscriptionPlan: string;
  isLoading: boolean;
  formatMoney: (amount: number) => string;
};

const BusinessSettingsContext = createContext<BusinessSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  businessName: "",
  subscriptionPlan: "FREE",
  isLoading: true,
  formatMoney: (amount) => formatCurrency(amount, "GHS"),
});

export function BusinessSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading } = useSettingsData();

  const settings = useMemo(
    () =>
      data?.settings
        ? mergeSettings(data.settings, {
            themeColor: data.business.themeColor,
            currency: data.business.currency,
            receiptFooter: data.business.receiptFooter,
          })
        : DEFAULT_SETTINGS,
    [data],
  );

  useEffect(() => {
    const root = document.documentElement;
    const { primaryColor, sidebarStyle, compactMode } = settings.appearance;

    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--ring", primaryColor);
    root.style.setProperty("--chart-1", primaryColor);

    root.style.setProperty(
      "--sidebar",
      sidebarStyle === "white" ? "#ffffff" : "#fff8f5",
    );

    root.classList.toggle("settings-compact", compactMode);
    root.dataset.locale = settings.language.defaultLocale;
    root.dataset.dateFormat = settings.language.dateFormat;
    root.dataset.timeFormat = settings.language.timeFormat;
  }, [settings.appearance, settings.language]);

  const value = useMemo(
    () => ({
      settings,
      businessName: data?.business.name ?? "",
      subscriptionPlan: data?.business.subscriptionPlan ?? "FREE",
      isLoading,
      formatMoney: (amount: number) => formatCurrency(amount, settings.currency),
    }),
    [settings, data?.business.name, data?.business.subscriptionPlan, isLoading],
  );

  return (
    <BusinessSettingsContext.Provider value={value}>
      {children}
    </BusinessSettingsContext.Provider>
  );
}

export function useBusinessSettings() {
  return useContext(BusinessSettingsContext);
}
