"use client";

import { useState, type ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

type Props = {
  email: string;
  sidebar: ReactNode;
  children: ReactNode;
};

export function AdminLayoutClient({ email, sidebar, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell flex min-h-screen flex-col">
      <AdminHeader
        email={email}
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
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
