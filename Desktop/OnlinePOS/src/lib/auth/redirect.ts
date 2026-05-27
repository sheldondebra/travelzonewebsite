/** Where to send the user immediately after a successful sign-in. */
export function getPostLoginPath(user: {
  role?: string | null;
  businessId?: string | null;
}): string {
  if (user.role === "PLATFORM_ADMIN") {
    return "/dashboard";
  }
  if (!user.businessId) {
    return "/onboarding/business";
  }
  return "/dashboard";
}
