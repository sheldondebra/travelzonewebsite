"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { TenantSwitcher } from "@/components/dashboard/tenant-switcher";
import { Button } from "@/components/ui/button";
import {
  dashboardLinks,
  isNavLinkActive,
  platformLinks,
  type DashboardNavLink,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { filterNavByModules } from "@/lib/settings/helpers";
import { parseApiResponse } from "@/lib/api-client";
import {
  getTenantContextState,
  type TenantContextOption,
} from "@/lib/platform/tenant-context";
import { isPlatformAdminUser } from "@/lib/platform/is-platform-admin";

type Props = {
  onNavigate?: () => void;
  className?: string;
};

function NavSection({
  title,
  links,
  pathname,
  compactMode,
  onNavigate,
}: {
  title?: string;
  links: DashboardNavLink[];
  pathname: string;
  compactMode: boolean;
  onNavigate?: () => void;
}) {
  if (links.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {title && (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          {title}
        </p>
      )}
      {links.map(({ href, label, icon, exact, iconStyle }) => {
        const active = isNavLinkActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group relative flex min-h-10 items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-200 touch-manipulation",
              compactMode && "min-h-9 py-1.5",
              active
                ? "bg-white/90 text-foreground shadow-card"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />
            )}
            <NavIcon icon={icon} style={iconStyle} active={active} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardNavContent({ onNavigate, className }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings, businessName } = useBusinessSettings();
  const isPlatformAdmin = isPlatformAdminUser(session?.user ?? {});
  const compactMode = settings.appearance.compactMode;
  const showBranding = settings.appearance.showBranding;

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
  const mainLinks = showTenantLinks
    ? filterNavByModules(dashboardLinks, settings.modules)
    : [];
  const adminLinks = isPlatformAdmin
    ? filterNavByModules(platformLinks, settings.modules)
    : [];

  const initials = (businessName || session?.user?.email || "S")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-sidebar safe-top",
        className,
      )}
    >
      <div className="shrink-0 px-4 pb-4 pt-5 lg:px-5">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-rose shadow-soft">
            <Sparkles className="size-[18px] text-primary-foreground" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            {showBranding ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  Tecunit
                </p>
                <p className="truncate font-heading text-sm font-bold tracking-tight text-foreground">
                  Social Commerce
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  Store
                </p>
                <p className="truncate font-heading text-sm font-bold tracking-tight text-foreground">
                  {businessName || "Dashboard"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2.5 px-4 lg:px-5">
        <GlobalSearch onNavigate={onNavigate} compact />
        <TenantSwitcher />
      </div>

      <nav className="scrollbar-thin mt-4 flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3 lg:px-4">
        <NavSection
          title="Menu"
          links={mainLinks}
          pathname={pathname}
          compactMode={compactMode}
          onNavigate={onNavigate}
        />
        {adminLinks.length > 0 && (
          <NavSection
            title="Administration"
            links={adminLinks}
            pathname={pathname}
            compactMode={compactMode}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <div className="mt-auto shrink-0 border-t border-sidebar-border bg-sidebar/95 px-3 py-3 backdrop-blur-sm lg:px-4">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-semibold text-foreground shadow-card">
            {initials}
          </span>
          {session?.user?.email && (
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {session.user.email}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          className="h-9 w-full justify-start gap-2.5 rounded-xl px-2 text-[13px] font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground touch-manipulation"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <LogOut className="size-3.5" strokeWidth={2} />
          </span>
          Sign out
        </Button>
      </div>
    </div>
  );
}
