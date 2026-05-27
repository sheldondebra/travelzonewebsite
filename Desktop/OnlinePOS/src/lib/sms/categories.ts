export const SMS_CATEGORIES = [
  "RECEIPT",
  "ORDER_CONFIRMATION",
  "PAYMENT_CONFIRMATION",
  "DELIVERY_ASSIGNMENT",
  "DELIVERY_UPDATE",
  "RIDER_NOTIFICATION",
  "REFUND",
  "PAY_LATER_REMINDER",
  "LOW_STOCK",
  "DAILY_SUMMARY",
  "MANUAL",
  "SECURITY",
  "MARKETING",
] as const;

export type SmsCategory = (typeof SMS_CATEGORIES)[number];

export const SENDER_ID_STATUSES = ["PENDING", "APPROVED", "DENIED"] as const;
export type SenderIdStatus = (typeof SENDER_ID_STATUSES)[number];

export const SMS_LOG_STATUSES = [
  "PENDING",
  "SENT",
  "FAILED",
  "DELIVERED",
  "UNDELIVERED",
] as const;

export type SmsLogStatus = (typeof SMS_LOG_STATUSES)[number];
