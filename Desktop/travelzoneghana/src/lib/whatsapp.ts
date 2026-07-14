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

export const whatsappPrefillMessage = DEFAULT_MESSAGE;
