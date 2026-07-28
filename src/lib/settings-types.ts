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

export type ResendSettings = {
  enabled: boolean;
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

export type ConsultationTimeSlotOption = {
  value: string;
  label: string;
};

export type ConsultationAvailabilitySettings = {
  openDays: number[];
  weekdaySlots: ConsultationTimeSlotOption[];
  saturdaySlots: ConsultationTimeSlotOption[];
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  blockedDates: string[];
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
  emailOnTicketRequest: boolean;
  emailCustomerOnTicketRequest: boolean;
  emailOnContactMessage: boolean;
  emailCustomerOnContactMessage: boolean;
};

export type FtpSettings = {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  /** Explicit FTPS (AUTH TLS). Recommended for cPanel. */
  secure: boolean;
  remoteFolder: string;
  publicBaseUrl: string;
  lastTestAt: string;
  lastTestOk: boolean;
  lastTestMessage: string;
};

export type SiteSettings = {
  paystack: PaystackSettings;
  splitsms: SplitSmsSettings;
  smtp: SmtpSettings;
  resend: ResendSettings;
  notifications: NotificationSettings;
  consultationAvailability: ConsultationAvailabilitySettings;
  ftp: FtpSettings;
};

export type AdminSettingsView = {
  paystack: PaystackSettings & { hasSecretKey: boolean };
  splitsms: SplitSmsSettings & { hasApiKey: boolean };
  smtp: SmtpSettings & { hasPassword: boolean };
  resend: ResendSettings & { hasApiKey: boolean };
  notifications: NotificationSettings;
  ftp: Omit<FtpSettings, "password"> & { hasPassword: boolean };
  status: {
    paystackReady: boolean;
    splitsmsReady: boolean;
    smtpReady: boolean;
    resendReady: boolean;
    emailReady: boolean;
    ftpReady: boolean;
  };
  revision: string;
};
