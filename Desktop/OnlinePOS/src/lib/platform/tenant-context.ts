export const PLATFORM_OFFICE_SLUG = "tecunit-general-office";

export type TenantContextOption = {
  id: string;
  name: string;
  slug: string;
};

export function getTenantContextState({
  currentBusinessId,
  tenants,
}: {
  currentBusinessId: string | null | undefined;
  tenants: TenantContextOption[];
}) {
  const currentBusiness =
    tenants.find((tenant) => tenant.id === currentBusinessId) ?? null;
  const isOfficeContext = currentBusiness?.slug === PLATFORM_OFFICE_SLUG;

  return {
    currentBusiness,
    currentBusinessName: currentBusiness?.name ?? "",
    isOfficeContext,
    canShowTenantMenu: Boolean(currentBusiness && !isOfficeContext),
  };
}

export function canShowDashboardRoute({
  pathname,
  isPlatformAdmin,
  canShowTenantMenu,
}: {
  pathname: string;
  isPlatformAdmin: boolean;
  canShowTenantMenu: boolean;
}) {
  if (!isPlatformAdmin || canShowTenantMenu) return true;
  // General Office overview + platform tools (no tenant impersonation)
  if (pathname === "/dashboard") return true;
  return pathname.startsWith("/dashboard/platform");
}
