"use client";

import type { LucideIcon } from "lucide-react";
import type { NavIconStyle } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type NavIconProps = {
  icon: LucideIcon;
  style: NavIconStyle;
  active?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: { box: "size-8", icon: "size-4" },
  md: { box: "size-9", icon: "size-[18px]" },
};

export function NavIcon({
  icon: Icon,
  style,
  active,
  size = "md",
  className,
}: NavIconProps) {
  const s = sizeClasses[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] transition-all duration-200",
        s.box,
        active ? style.activeBg : style.bg,
        active ? style.activeText : style.text,
        active && "shadow-sm",
        className,
      )}
    >
      <Icon className={s.icon} strokeWidth={active ? 2.25 : 1.75} />
    </span>
  );
}
