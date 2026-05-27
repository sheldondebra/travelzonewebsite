"use client";

import { cn } from "@/lib/utils";

export type FilterPill = {
  value: string;
  label: string;
};

type FilterPillsProps = {
  options: FilterPill[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterPills({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "border border-gray-100 bg-white text-muted-foreground hover:bg-brand-rose/40 hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
