"use client";

import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NavIcon } from "@/components/dashboard/nav-icon";
import {
  isNavLinkActive,
  mobileTabLinks,
  navIconStyles,
} from "@/lib/dashboard-nav";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { filterNavByModules } from "@/lib/settings/helpers";
import { cn } from "@/lib/utils";
import { parseApiResponse } from "@/lib/api-client";
import {
  getTenantContextState,
  type TenantContextOption,
} from "@/lib/platform/tenant-context";

type Props = {
  onMenuClick: () => void;
};

export function DashboardBottomNav({ onMenuClick }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useBusinessSettings();
  const isPlatformAdmin = session?.user?.role === "PLATFORM_ADMIN";
  const { data: tenants = [] } = useQuery({
    queryKey: ["platform-tenants"],
    enabled: isPlatformAdmin,
    queryFn: async () => {
      const res = await fetch("/api/platform/tenants");
      return parseApiResponse<TenantContextOption[]>(res);
    },
  });
  const tenantContext = getTenantContextState({
    currentBusinessId: session?.user?.businessId,
    tenants,
  });
  const showTenantLinks = !isPlatformAdmin || tenantContext.canShowTenantMenu;
  const tabs = showTenantLinks
    ? filterNavByModules(mobileTabLinks, settings.modules).map((tab) =>
        tab.href === "/dashboard" ? { ...tab, label: "Home" } : tab,
      )
    : [];
  const menuActive =
    !tabs.some(({ href, exact }) =>
      isNavLinkActive(pathname, href, exact),
    ) && !pathname.startsWith("/dashboard/pos");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      aria-hidden={false}
    >
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto mx-auto flex h-[var(--app-bottom-nav-height)] max-w-md items-stretch justify-around rounded-2xl border border-gray-100/80 bg-white/90 px-1 shadow-elevated backdrop-blur-xl"
      >
        {tabs.map(({ href, label, icon, exact, iconStyle }) => {
          const active = isNavLinkActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors touch-manipulation",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <NavIcon icon={icon} style={iconStyle} active={active} size="sm" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMenuClick}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors touch-manipulation",
            menuActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <NavIcon
            icon={Menu}
            style={navIconStyles.settings}
            active={menuActive}
            size="sm"
          />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
