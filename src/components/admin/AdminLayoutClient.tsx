"use client";

import { useState, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminToastProvider } from "@/components/admin/AdminToastProvider";
import type { SplitSmsBalance } from "@/lib/splitsms";
import type { StaffRole } from "@/lib/supabase/auth";

type Props = {
  email: string;
  role: StaffRole;
  splitsmsReady: boolean;
  smsBalance: SplitSmsBalance | null;
  smsBalanceError: string | null;
  sidebar: ReactNode;
  children: ReactNode;
};

export function AdminLayoutClient({
  email,
  role,
  splitsmsReady,
  smsBalance,
  smsBalanceError,
  sidebar,
  children,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AdminToastProvider>
      <div className="admin-shell flex min-h-screen flex-col">
        <AdminHeader
          email={email}
          role={role}
          splitsmsReady={splitsmsReady}
          smsBalance={smsBalance}
          smsBalanceError={smsBalanceError}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
        />
        <div className="relative flex min-h-0 flex-1">
          {menuOpen ? (
            <button
              type="button"
              aria-label="Close menu"
              className="admin-sidebar-backdrop md:hidden"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}
          <div
            className={`admin-sidebar ${menuOpen ? "admin-sidebar-open" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {sidebar}
          </div>
          <main className="admin-content">{children}</main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
