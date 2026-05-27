/** Shared platform admin check (role or allowlisted email). */

export function getPlatformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminUser(user: {
  role?: string | null;
  email?: string | null;
}): boolean {
  if (user.role === "PLATFORM_ADMIN") return true;
  const email = user.email?.trim().toLowerCase();
  if (!email) return false;
  return getPlatformAdminEmails().includes(email);
}
