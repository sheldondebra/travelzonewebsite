export type PaystackSettings = {
  enabled: boolean;
  secretKey: string;
  publicKey: string;
};

export type SplitSmsSettings = {
  enabled: boolean;
  apiKey: string;
  senderId: string;
  adminPhones: string;
  baseUrl: string;
};

export type SmtpSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

export type NotificationSettings = {
  emailOnBookingPaid: boolean;
  emailOnBookingPaidTo: string;
  emailCustomerOnBookingPaid: boolean;
  smsOnBookingPaid: boolean;
  smsCustomerOnBookingPaid: boolean;
  smsAdminOnBookingPaid: boolean;
  emailOnNewsletterSignup: boolean;
  emailOnNewsletterSignupTo: string;
  emailOnConsultationRequest: boolean;
  emailCustomerOnConsultationRequest: boolean;
  emailOnContactMessage: boolean;
  emailCustomerOnContactMessage: boolean;
};

export type SiteSettings = {
  paystack: PaystackSettings;
  splitsms: SplitSmsSettings;
  smtp: SmtpSettings;
  notifications: NotificationSettings;
};

export type AdminSettingsView = {
  paystack: PaystackSettings & { hasSecretKey: boolean };
  splitsms: SplitSmsSettings & { hasApiKey: boolean };
  smtp: SmtpSettings & { hasPassword: boolean };
  notifications: NotificationSettings;
  status: {
    paystackReady: boolean;
    splitsmsReady: boolean;
    smtpReady: boolean;
  };
};
