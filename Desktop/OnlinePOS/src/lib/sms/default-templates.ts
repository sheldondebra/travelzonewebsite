import { SMS_TEMPLATE_KEYS } from "@/lib/sms/automation-keys";

export type DefaultSmsTemplate = {
  key: string;
  title: string;
  message: string;
};

export const DEFAULT_SMS_TEMPLATES: DefaultSmsTemplate[] = [
  {
    key: SMS_TEMPLATE_KEYS.RECEIPT_SMS,
    title: "Receipt SMS",
    message:
      "Thank you for shopping with {{businessName}}. Receipt No: {{receiptNumber}}. Amount paid: GHS {{amount}}. View receipt: {{receiptLink}}",
  },
  {
    key: SMS_TEMPLATE_KEYS.ORDER_CONFIRMATION,
    title: "Order confirmation",
    message:
      "Hi {{customerName}}, your order {{orderNumber}} from {{businessName}} has been received. Total: GHS {{amount}}. Thank you.",
  },
  {
    key: SMS_TEMPLATE_KEYS.PAYMENT_CONFIRMATION,
    title: "Payment confirmation",
    message:
      "Payment received for order {{orderNumber}}. Amount: GHS {{amount}} via {{paymentMethod}}. Thank you for choosing {{businessName}}.",
  },
  {
    key: SMS_TEMPLATE_KEYS.RIDER_DELIVERY_ASSIGNMENT,
    title: "Rider delivery assignment",
    message:
      "New delivery assigned. Order: {{orderNumber}}. Customer: {{customerName}}. Phone: {{customerPhone}}. Address: {{deliveryAddress}}. Fee: GHS {{deliveryFee}}.",
  },
  {
    key: SMS_TEMPLATE_KEYS.DELIVERY_UPDATE,
    title: "Delivery update",
    message:
      "Hi {{customerName}}, your order {{orderNumber}} from {{businessName}} is now {{deliveryStatus}}. Rider: {{riderName}} {{riderPhone}}.",
  },
  {
    key: SMS_TEMPLATE_KEYS.DELIVERED,
    title: "Delivered",
    message:
      "Your order {{orderNumber}} from {{businessName}} has been delivered. Thank you for shopping with us.",
  },
  {
    key: SMS_TEMPLATE_KEYS.REFUND,
    title: "Refund",
    message:
      "Refund processed for order {{orderNumber}}. Amount: GHS {{amount}}. Reason: {{reason}}. {{businessName}}",
  },
  {
    key: SMS_TEMPLATE_KEYS.PAY_LATER_REMINDER,
    title: "Pay later reminder",
    message:
      "Hi {{customerName}}, you have a pending balance of GHS {{amount}} for order {{orderNumber}} at {{businessName}}. Kindly complete payment. Thank you.",
  },
  {
    key: SMS_TEMPLATE_KEYS.LOW_STOCK,
    title: "Low stock alert",
    message:
      "Low stock alert: {{productName}} has only {{stockQuantity}} {{unit}} left. Please restock soon.",
  },
  {
    key: SMS_TEMPLATE_KEYS.DAILY_SUMMARY,
    title: "Daily sales summary",
    message:
      "{{businessName}} Daily Summary: Sales GHS {{sales}}, Profit GHS {{profit}}, Orders {{orders}}, Expenses GHS {{expenses}}.",
  },
];

export const DEFAULT_SMS_PACKAGES = [
  { name: "Starter SMS", smsCount: 100, price: 25, currency: "GHS", sortOrder: 1 },
  { name: "Growth SMS", smsCount: 500, price: 100, currency: "GHS", sortOrder: 2 },
  { name: "Business SMS", smsCount: 1000, price: 180, currency: "GHS", sortOrder: 3 },
  { name: "Enterprise SMS", smsCount: 5000, price: 800, currency: "GHS", sortOrder: 4 },
];
