"use client";

import { usePathname } from "next/navigation";
import { isDashboardFocusMode } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPos =
    pathname === "/dashboard/pos" || pathname.startsWith("/dashboard/pos/");
  const isFocus = isDashboardFocusMode(pathname);

  return (
    <main
      className={cn(
        "min-h-0 flex-1",
        isPos
          ? "overflow-hidden p-0"
          : cn(
              "surface-main overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 xl:p-10 scrollbar-thin",
              isFocus
                ? "app-scroll-padding-focus lg:pb-10"
                : "app-scroll-padding lg:pb-10",
            ),
      )}
    >
      {children}
    </main>
  );
}
