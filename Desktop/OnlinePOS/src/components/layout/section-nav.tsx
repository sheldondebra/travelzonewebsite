"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type SectionNavProps = {
  title: string;
  items: SectionNavItem[];
  className?: string;
};

export function SectionNav({ title, items, className }: SectionNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("shrink-0 lg:w-56 xl:w-60", className)}>
      <div className="mb-3 hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-brand-cream via-white to-brand-rose/30 px-4 py-3 shadow-sm lg:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
          Section
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold tracking-tight text-foreground">
          {title}
        </p>
      </div>
      <div className="relative -mx-1 lg:mx-0">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-brand-surface to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-brand-surface to-transparent lg:hidden" />
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1.5 lg:overflow-visible lg:rounded-3xl lg:border lg:border-gray-100/90 lg:bg-white/95 lg:p-2.5 lg:shadow-card [&::-webkit-scrollbar]:hidden">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all touch-manipulation lg:px-3.5 lg:py-3",
                  active
                    ? "border-primary/25 bg-gradient-to-r from-primary/15 via-brand-cream/80 to-white text-foreground shadow-card"
                    : "border-gray-100/80 bg-white text-muted-foreground hover:border-primary/15 hover:bg-brand-cream/50 hover:text-foreground lg:bg-transparent",
                )}
              >
                {active && (
                  <span className="absolute inset-y-3 left-0 hidden w-[3px] rounded-full bg-primary lg:block" />
                )}
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/70 text-muted-foreground group-hover:bg-white group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" strokeWidth={active ? 2 : 1.75} />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
