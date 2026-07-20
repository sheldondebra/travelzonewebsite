import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items,
  action,
}: {
  items: { label: string; href?: string }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => (
          <span key={item.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#6B7280]" />}
            {item.href ? (
              <Link href={item.href} className="text-[#0057FF] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[#002B7F]">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      {action}
    </div>
  );
}
