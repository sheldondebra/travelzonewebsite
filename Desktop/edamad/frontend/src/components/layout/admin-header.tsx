"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { adminProfileDefaults } from "@/lib/admin-dashboard-data";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

type AdminHeaderProps = {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
};

export function AdminHeader({ searchQuery = "", onSearchChange }: AdminHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: dashboardData } = useAdminDashboard();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? adminProfileDefaults.name;
  const firstName = displayName.split(" ")[0] ?? "Admin";
  const displayRole = user?.role === "admin" ? adminProfileDefaults.role : "Admin";
  const openTicketCount = dashboardData?.open_ticket_count ?? dashboardData?.stats?.[4]?.value ?? 0;
  const notifications =
    dashboardData?.recent_activities.slice(0, 4) ?? [
      { id: "fallback-1", text: "New support ticket submitted", time: "Recently" },
      { id: "fallback-2", text: "New user registration", time: "Recently" },
    ];
  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || adminProfileDefaults.initials;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Session may already be expired
    }
    clearAuth();
    router.push("/auth/login");
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-[#E5EAF2] bg-white px-5">
      <button
        type="button"
        className="rounded-md p-1.5 text-[#002B7F] hover:bg-[#F7F9FC] lg:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 shrink-0">
        <p className="text-[15px] font-semibold leading-tight text-[#002B7F]">
          Hello, {firstName} <span className="font-normal">👋</span>
        </p>
        <p className="text-[12px] text-[#6B7280]">Welcome back to Ed-Amad Learning Consult</p>
      </div>

      <div className="relative mx-auto hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          className="ed-input w-full pl-9"
          placeholder="Search users, courses, tickets..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-[#002B7F] hover:bg-[#F7F9FC]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {openTicketCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white">
                {openTicketCount > 9 ? "9+" : openTicketCount}
              </span>
            ) : null}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-[10px] border border-[#E5EAF2] bg-white p-3 shadow-lg">
              <p className="mb-2 text-[12px] font-semibold text-[#002B7F]">Notifications</p>
              <ul className="max-h-56 space-y-2 overflow-y-auto text-[12px] text-[#374151]">
                {notifications.map((item) => (
                  <li key={item.id} className="rounded-lg bg-[#F7F9FC] p-2">
                    <p className="leading-snug">{item.text}</p>
                    <p className="mt-0.5 text-[10px] text-[#9CA3AF]">{item.time}</p>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/tickets"
                className="mt-2 block text-center text-[12px] font-medium text-[#0057FF] hover:underline"
                onClick={() => setNotifOpen(false)}
              >
                View support tickets
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-[#E5EAF2] bg-white py-1 pl-1 pr-2 hover:bg-[#F7F9FC]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0057FF] text-[12px] font-bold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-semibold leading-tight text-[#002B7F]">{displayName}</p>
              <p className="text-[11px] text-[#6B7280]">{displayRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-[10px] border border-[#E5EAF2] bg-white py-1 shadow-lg">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F7F9FC]"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F7F9FC]"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F7F9FC]"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
