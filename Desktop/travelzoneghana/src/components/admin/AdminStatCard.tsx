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
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </p>
        {icon ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              highlight ? "bg-brand-red/10 text-brand-red" : "bg-cream text-navy/70"
            }`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="heading-serif mt-3 text-3xl text-navy">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
      {href ? (
        <p className="mt-3 text-xs font-semibold text-brand-red opacity-0 transition-opacity group-hover:opacity-100">
          View details →
        </p>
      ) : null}
    </>
  );

  const className = `group rounded-xl border bg-white px-5 py-4 shadow-sm transition-all ${
    highlight
      ? "border-brand-red/30 hover:border-brand-red/50 hover:shadow-md"
      : "border-parchment hover:border-parchment hover:shadow-md"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
