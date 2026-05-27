import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  highlight?: boolean;
  accent?: "green" | "amber" | "blue";
  className?: string;
};

const accentStyles = {
  green: "text-green-700",
  amber: "text-amber-700",
  blue: "text-blue-700",
};

const iconBgStyles = {
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  highlight,
  accent,
  className,
}: StatCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "transition-shadow hover:shadow-soft",
        highlight && "border-primary/15 bg-gradient-to-br from-white via-white to-brand-cream/50",
        className,
      )}
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-3">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              accent ? iconBgStyles[accent] : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </span>
        </div>
        <CardTitle
          className={cn(
            "mt-2 text-2xl font-bold tabular-nums tracking-tight",
            accent && accentStyles[accent],
          )}
        >
          {value}
        </CardTitle>
        {sub && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</p>
        )}
      </CardHeader>
    </Card>
  );
}
