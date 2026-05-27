import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
} from "lucide-react";
import type { BusinessSettings } from "@/lib/settings/defaults";
import type { DashboardNavLink } from "@/lib/dashboard-nav";

export type CurrencyConfig = BusinessSettings["currency"];

export function formatCurrency(
  amount: number,
  currency: string | CurrencyConfig,
  options?: { decimals?: number },
) {
  const cfg: CurrencyConfig =
    typeof currency === "string"
      ? {
          code: currency,
          symbol: currency === "GHS" ? "₵" : `${currency} `,
          symbolPosition: "before",
          decimalPlaces: 2,
        }
      : currency;

  const decimals = options?.decimals ?? cfg.decimalPlaces ?? 2;
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (cfg.symbolPosition === "after") {
    return `${formatted}${cfg.symbol}`;
  }
  return `${cfg.symbol}${formatted}`;
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash", icon: Banknote, settingKey: "cash" as const },
  { value: "MOMO", label: "Mobile Money", icon: Smartphone, settingKey: "momo" as const },
  {
    value: "BANK_TRANSFER",
    label: "Bank",
    icon: Building2,
    settingKey: "bankTransfer" as const,
  },
  { value: "CARD", label: "Card", icon: CreditCard, settingKey: "card" as const },
] as const;

export type PaymentMethodOption = (typeof PAYMENT_METHOD_OPTIONS)[number] & {
  icon: LucideIcon;
};

export function getEnabledPaymentMethods(
  methods: BusinessSettings["paymentMethods"],
): PaymentMethodOption[] {
  const enabled = PAYMENT_METHOD_OPTIONS.filter((m) => methods[m.settingKey]);
  return enabled.length > 0 ? [...enabled] : [...PAYMENT_METHOD_OPTIONS];
}

export function filterNavByModules(
  links: DashboardNavLink[],
  modules: BusinessSettings["modules"],
): DashboardNavLink[] {
  return links.filter((link) => {
    if (!link.moduleKey) return true;
    return modules[link.moduleKey];
  });
}

export function playScanBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    /* audio unavailable */
  }
}

export const LAST_POS_CUSTOMER_KEY = "pos-last-customer-id";
