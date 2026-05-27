"use client";

import { usePathname } from "next/navigation";
import { SettingsNav } from "@/components/settings/settings-nav";

export function SettingsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOverview = pathname === "/dashboard/settings";

  if (isOverview) {
    return <div className="min-w-0 flex-1">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <SettingsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
