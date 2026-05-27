export type BusinessSettings = {
  appearance: {
    primaryColor: string;
    sidebarStyle: "cream" | "white";
    compactMode: boolean;
    showBranding: boolean;
  };
  language: {
    defaultLocale: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
  };
  paymentMethods: {
    cash: boolean;
    momo: boolean;
    bankTransfer: boolean;
    card: boolean;
    payLater: boolean;
  };
  sms: {
    enabled: boolean;
    provider: string;
    apiKey: string;
    senderId: string;
  };
  smsTemplates: {
    orderConfirmation: string;
    posReceipt: string;
    paymentReminder: string;
    deliveryUpdate: string;
  };
  mail: {
    enabled: boolean;
    fromName: string;
    fromEmail: string;
    smtpHost: string;
    smtpPort: number;
  };
  emailTemplates: {
    welcomeEmail: string;
    orderReceipt: string;
    orderReceiptSubject: string;
  };
  pos: {
    soundOnScan: boolean;
    autoSelectCustomer: boolean;
    defaultPaymentMethod: string;
    allowPriceEdit: boolean;
    requireCashierPin: boolean;
    allowCashierSwitch: boolean;
  };
  posReceipt: {
    showLogo: boolean;
    showTaxBreakdown: boolean;
    showItemCodes: boolean;
    showBusinessPhone: boolean;
    showBusinessAddress: boolean;
    paperSize: "58mm" | "80mm";
    headerText: string;
    thankYouMessage: string;
    businessPhone: string;
    businessAddress: string;
    sendSmsOnSale: boolean;
    sendEmailOnSale: boolean;
  };
  modules: {
    pos: boolean;
    marketplace: boolean;
    suppliers: boolean;
    analytics: boolean;
    tasks: boolean;
  };
  paymentGateway: {
    provider: string;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    testMode: boolean;
  };
  warehouse: {
    enabled: boolean;
    defaultName: string;
    allowNegativeStock: boolean;
  };
  currency: {
    code: string;
    symbol: string;
    symbolPosition: "before" | "after";
    decimalPlaces: number;
  };
  backup: {
    autoBackup: boolean;
    frequency: "daily" | "weekly" | "monthly";
    lastBackupAt: string | null;
  };
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  appearance: {
    primaryColor: "#F8BBD0",
    sidebarStyle: "cream",
    compactMode: false,
    showBranding: true,
  },
  language: {
    defaultLocale: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  },
  paymentMethods: {
    cash: true,
    momo: true,
    bankTransfer: true,
    card: true,
    payLater: true,
  },
  sms: {
    enabled: false,
    provider: "hubtel",
    apiKey: "",
    senderId: "",
  },
  smsTemplates: {
    orderConfirmation:
      "Hi {{name}}, your order #{{orderId}} of {{total}} is confirmed. Thank you!",
    posReceipt:
      "{{businessName}}\nReceipt {{orderRef}}\n{{date}}\n{{itemsSummary}}\nTotal: {{total}}\nPaid: {{paid}}\n{{thankYou}}",
    paymentReminder:
      "Reminder: {{total}} is due on order #{{orderId}}. Please pay at your convenience.",
    deliveryUpdate:
      "Your order #{{orderId}} is {{status}}. Track with us anytime.",
  },
  mail: {
    enabled: false,
    fromName: "",
    fromEmail: "",
    smtpHost: "",
    smtpPort: 587,
  },
  emailTemplates: {
    welcomeEmail: "Welcome to {{businessName}}! We're glad you're here.",
    orderReceiptSubject: "Your receipt from {{businessName}} — {{orderRef}}",
    orderReceipt:
      "Hi {{name}},\n\nThank you for your purchase.\n\nOrder: {{orderRef}}\nDate: {{date}}\nTotal: {{total}}\nPayment: {{paymentStatus}}\n\n{{itemsSummary}}\n\n{{thankYou}}\n\n— {{businessName}}",
  },
  pos: {
    soundOnScan: true,
    autoSelectCustomer: false,
    defaultPaymentMethod: "CASH",
    allowPriceEdit: true,
    requireCashierPin: false,
    allowCashierSwitch: true,
  },
  posReceipt: {
    showLogo: true,
    showTaxBreakdown: true,
    showItemCodes: true,
    showBusinessPhone: true,
    showBusinessAddress: false,
    paperSize: "80mm",
    headerText: "",
    thankYouMessage: "Thank you for shopping with us!",
    businessPhone: "",
    businessAddress: "",
    sendSmsOnSale: true,
    sendEmailOnSale: true,
  },
  modules: {
    pos: true,
    marketplace: true,
    suppliers: true,
    analytics: true,
    tasks: true,
  },
  paymentGateway: {
    provider: "paystack",
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    testMode: true,
  },
  warehouse: {
    enabled: false,
    defaultName: "Main warehouse",
    allowNegativeStock: false,
  },
  currency: {
    code: "GHS",
    symbol: "₵",
    symbolPosition: "before",
    decimalPlaces: 2,
  },
  backup: {
    autoBackup: false,
    frequency: "weekly",
    lastBackupAt: null,
  },
};

export function mergeSettings(
  raw: unknown,
  business?: { themeColor?: string | null; currency?: string; receiptFooter?: string | null },
): BusinessSettings {
  const base = structuredClone(DEFAULT_SETTINGS);
  if (business?.themeColor) base.appearance.primaryColor = business.themeColor;
  if (business?.currency) {
    base.currency.code = business.currency;
    if (business.currency === "GHS") base.currency.symbol = "₵";
  }
  if (business?.receiptFooter) {
    base.posReceipt.thankYouMessage = business.receiptFooter;
  }
  if (!raw || typeof raw !== "object") return base;
  return deepMerge(base, raw as Partial<BusinessSettings>);
}

export function applySettingsPatch(
  current: BusinessSettings,
  patch: Partial<BusinessSettings>,
): BusinessSettings {
  return deepMerge(current, patch);
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const out = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = deepMerge(tv as object, sv as object) as T[keyof T];
    } else if (sv !== undefined) {
      out[key] = sv as T[keyof T];
    }
  }
  return out;
}
