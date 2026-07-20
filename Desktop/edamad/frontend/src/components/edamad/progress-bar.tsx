import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  color = "#0057FF",
  height = 8,
}: {
  value: number;
  className?: string;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-[#E5EAF2]", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}
