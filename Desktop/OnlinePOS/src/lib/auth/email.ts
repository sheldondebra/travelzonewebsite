/** Normalize email for storage and lookup (case-insensitive login). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
