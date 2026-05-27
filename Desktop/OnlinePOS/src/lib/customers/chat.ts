import { buildSmsShareUrl, buildWhatsAppShareUrl } from "@/lib/receipt/share";

export function buildCustomerGreeting(name: string, businessName?: string) {
  const shop = businessName?.trim() ? businessName.trim() : "our store";
  return `Hi ${name.split(" ")[0] || name}, thank you for shopping with ${shop}! How can we help you today?`;
}

export function openCustomerWhatsApp(phone: string | null | undefined, name: string, businessName?: string) {
  const text = buildCustomerGreeting(name, businessName);
  const url = buildWhatsAppShareUrl(text, phone);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openCustomerSms(phone: string | null | undefined, name: string, businessName?: string) {
  const text = buildCustomerGreeting(name, businessName);
  const url = buildSmsShareUrl(text, phone);
  window.location.href = url;
}
