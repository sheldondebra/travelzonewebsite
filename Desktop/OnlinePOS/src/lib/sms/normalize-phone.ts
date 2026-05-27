export function normalizeGhanaPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    return `233${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("233")) {
    return cleaned;
  }

  if (cleaned.length === 9) {
    return `233${cleaned}`;
  }

  return cleaned;
}
