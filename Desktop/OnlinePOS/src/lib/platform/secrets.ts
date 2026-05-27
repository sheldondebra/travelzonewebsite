const MASK = "••••••••";

export function maskSecret(value: string | undefined | null, visibleTail = 4): string {
  if (!value?.trim()) return "";
  const v = value.trim();
  if (v.length <= visibleTail) return MASK;
  return `${MASK}${v.slice(-visibleTail)}`;
}

/** Placeholder returned to client; do not persist over existing secret. */
export const SECRET_PLACEHOLDER = MASK;

export function isMaskedOrEmpty(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  return value.includes("••••") || value === SECRET_PLACEHOLDER;
}

export function mergeSecret(
  incoming: string | undefined,
  existing: string | undefined,
): string | undefined {
  if (!incoming || isMaskedOrEmpty(incoming)) return existing;
  return incoming.trim();
}
