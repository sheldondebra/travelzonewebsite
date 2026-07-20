"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Crosshair,
  GraduationCap,
  HelpCircle,
  Home,
  LineChart,
  LogOut,
  Settings,
  User,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { design, NAV_ITEMS } from "@/lib/design";
import { BrandMark } from "@/components/edamad/brand-mark";

const iconMap = {
  home: Home,
  courses: GraduationCap,
  live: Video,
  practice: Crosshair,
  bookmarks: Bookmark,
  progress: LineChart,
  profile: User,
  settings: Settings,
  support: HelpCircle,
};

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/courses/store") {
      return (
        pathname.startsWith("/courses/store") ||
        pathname === "/checkout" ||
        /^\/courses\/[^/]+\/lessons/.test(pathname)
      );
    }
    if (href === "/live-classes") {
      return pathname === "/live-classes" || pathname.startsWith("/live-classes/");
    }
    if (href === "/practice") {
      return pathname === "/practice" || pathname.startsWith("/practice/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex h-screen shrink-0 flex-col text-white"
      style={{
        width: design.layout.sidebarWidth,
        backgroundColor: design.colors.sidebar,
      }}
    >
      <div className="border-b border-white/10 px-3 pb-5 pt-6">
        <BrandMark variant="sidebar" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const Icon = iconMap[icon];
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium leading-snug transition-colors",
                active
                  ? "bg-white/[0.14] text-white"
                  : "text-white/85 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              <Icon className="h-[16px] w-[16px] shrink-0 stroke-[1.75]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href="/auth/logout"
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors",
            pathname === "/auth/logout"
              ? "bg-[#0057FF] text-white"
              : "text-white/85 hover:bg-white/[0.07] hover:text-white",
          )}
        >
          <LogOut className="h-[16px] w-[16px] shrink-0 stroke-[1.75]" />
          Log Out
        </Link>
      </div>
    </aside>
  );
}
