import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, actions }: Props) {
  return (
    <div className="admin-page-header">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="admin-page-title">{title}</h1>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </div>
      {description ? <p className="admin-page-description">{description}</p> : null}
    </div>
  );
}

type WidgetProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function AdminWidget({ title, children, className = "" }: WidgetProps) {
  return (
    <div className={`admin-postbox ${className}`.trim()}>
      <div className="admin-postbox-header">
        <h2>{title}</h2>
      </div>
      <div className="admin-postbox-body">{children}</div>
    </div>
  );
}

export function AdminNotice({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "warning" | "error" | "success";
}) {
  return (
    <div className={`admin-notice admin-notice-${variant}`}>{children}</div>
  );
}

export function AdminButton({
  href,
  children,
  secondary,
}: {
  href?: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  const className = secondary ? "admin-button-secondary" : "admin-button-primary";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button type="button" className={className}>{children}</button>;
}
