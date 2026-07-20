import { cn } from "@/lib/utils";

export function RightPanel({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("ed-card p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-[#002B7F]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
