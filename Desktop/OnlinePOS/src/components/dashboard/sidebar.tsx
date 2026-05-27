"use client";

import { DashboardNavContent } from "@/components/dashboard/dashboard-nav-content";

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh max-h-dvh w-[272px] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex">
      <DashboardNavContent />
    </aside>
  );
}
