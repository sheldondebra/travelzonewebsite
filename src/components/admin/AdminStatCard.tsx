import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  icon?: ReactNode;
  highlight?: boolean;
};

export function AdminStatCard({ label, value, hint, href, icon, highlight }: Props) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="admin-stat-tile-label">{label}</p>
        {icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
              highlight ? "bg-brand-red/10 text-brand-red" : "bg-cream text-navy/70"
            }`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="admin-stat-tile-value">{value}</p>
      {hint ? <p className="admin-stat-tile-hint">{hint}</p> : null}
    </>
  );

  const className = `admin-stat-tile ${highlight ? "admin-stat-tile-highlight" : ""}`.trim();

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
