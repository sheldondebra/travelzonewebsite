import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "full";
};

export function PageShell({
  children,
  className,
  size = "default",
}: PageShellProps) {
  return (
    <div
      className={cn(
        "page-container space-y-6 sm:space-y-8",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        size === "full" && "max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
