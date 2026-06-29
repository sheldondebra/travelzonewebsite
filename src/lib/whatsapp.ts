import { contactInfo } from "@/lib/content";

const DEFAULT_MESSAGE =
  "Hello Travel Zone Ghana, I would like to inquire about your travel packages.";

/** E.164 digits only for wa.me (no +). Uses primary office line. */
export function getWhatsAppNumber() {
  const href = contactInfo.phoneHrefs[0] ?? "+233244274663";
  return href.replace(/\D/g, "");
}

export function getWhatsAppUrl(message = DEFAULT_MESSAGE) {
  const phone = getWhatsAppNumber();
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

/** wa.me link to message a customer (Ghana-friendly phone normalization). */
export function getCustomerWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;

  if (digits.startsWith("0")) {
    normalized = `233${digits.slice(1)}`;
  } else if (digits.length === 9) {
    normalized = `233${digits}`;
  }

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export const whatsappPrefillMessage = DEFAULT_MESSAGE;
