import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  iconColor = "#0057FF",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
}) {
  return (
    <div className="ed-card flex items-center gap-3 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-xl font-bold text-[#002B7F]">{value}</p>
      </div>
    </div>
  );
}
