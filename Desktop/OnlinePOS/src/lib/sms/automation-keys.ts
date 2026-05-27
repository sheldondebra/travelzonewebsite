export const SMS_AUTOMATION_KEYS = [
  "receipt_sms",
  "order_confirmation_sms",
  "payment_sms",
  "delivery_sms",
  "rider_sms",
  "refund_sms",
  "pay_later_reminder_sms",
  "low_stock_sms",
  "daily_summary_sms",
] as const;

export type SmsAutomationKey = (typeof SMS_AUTOMATION_KEYS)[number];

export const SMS_AUTOMATION_LABELS: Record<SmsAutomationKey, string> = {
  receipt_sms: "Receipt SMS",
  order_confirmation_sms: "Order confirmation SMS",
  payment_sms: "Payment confirmation SMS",
  delivery_sms: "Delivery update SMS",
  rider_sms: "Rider assignment SMS",
  refund_sms: "Refund SMS",
  pay_later_reminder_sms: "Pay later reminder SMS",
  low_stock_sms: "Low stock alert SMS",
  daily_summary_sms: "Daily sales summary SMS",
};

export const SMS_TEMPLATE_KEYS = {
  RECEIPT_SMS: "RECEIPT_SMS",
  ORDER_CONFIRMATION: "ORDER_CONFIRMATION",
  PAYMENT_CONFIRMATION: "PAYMENT_CONFIRMATION",
  RIDER_DELIVERY_ASSIGNMENT: "RIDER_DELIVERY_ASSIGNMENT",
  DELIVERY_UPDATE: "DELIVERY_UPDATE",
  DELIVERED: "DELIVERED",
  REFUND: "REFUND",
  PAY_LATER_REMINDER: "PAY_LATER_REMINDER",
  LOW_STOCK: "LOW_STOCK",
  DAILY_SUMMARY: "DAILY_SUMMARY",
} as const;
