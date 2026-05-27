"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardMobileHeader } from "@/components/dashboard/dashboard-mobile-header";
import { DashboardNavContent } from "@/components/dashboard/dashboard-nav-content";
import { BusinessSettingsProvider } from "@/components/settings/business-settings-provider";
import { DashboardMain } from "@/components/dashboard/dashboard-main";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { isDashboardFocusMode } from "@/lib/dashboard-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";
import { isPlatformAdminUser } from "@/lib/platform/is-platform-admin";
import {
  canShowDashboardRoute,
  getTenantContextState,
  type TenantContextOption,
} from "@/lib/platform/tenant-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isPos =
    pathname === "/dashboard/pos" || pathname.startsWith("/dashboard/pos/");
  const isFocus = isDashboardFocusMode(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isPlatformAdmin = isPlatformAdminUser(session?.user ?? {});
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
  const showRoute = canShowDashboardRoute({
    pathname,
    isPlatformAdmin,
    canShowTenantMenu: tenantContext.canShowTenantMenu,
  });

  const openDrawer = () => setDrawerOpen(true);

  return (
    <BusinessSettingsProvider>
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-brand-surface antialiased">
        <DashboardSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {!isPos && <DashboardMobileHeader onMenuClick={openDrawer} />}
          <DashboardMain>
            {showRoute ? (
              children
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    General Office
                  </p>
                  <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                    Select a Business
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tenant menus and store data stay hidden until you choose and
                    confirm a business from the navigation drawer.
                  </p>
                  <Button className="mt-5" onClick={openDrawer}>
                    Select a Business
                  </Button>
                </div>
              </div>
            )}
          </DashboardMain>
          {!isPos && !isFocus && (
            <DashboardBottomNav onMenuClick={openDrawer} />
          )}
        </div>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent
            side="left"
            className="w-[min(100vw-1rem,288px)] gap-0 border-sidebar-border p-0"
            showCloseButton
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation menu</SheetTitle>
            </SheetHeader>
            <DashboardNavContent onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </BusinessSettingsProvider>
  );
}
