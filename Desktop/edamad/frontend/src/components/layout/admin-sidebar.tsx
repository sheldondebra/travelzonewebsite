"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  FileQuestion,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ScrollText,
  Settings,
  Shield,
  Ticket,
  Upload,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/edamad/brand-mark";
import { logout } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";

const groups = [
  {
    label: "MAIN",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/students", label: "Users", icon: Users },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/lessons", label: "Lessons", icon: Video },
      { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCap },
      { href: "/admin/certificates", label: "Certificates", icon: Award },
      { href: "/admin/assessments", label: "Assessments", icon: FileQuestion },
      { href: "/admin/courses/upload", label: "Video Upload", icon: Upload },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/admin/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/materials", label: "Learning Materials", icon: BookOpen },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { href: "/admin/tickets", label: "Support Tickets", icon: Ticket },
      { href: "/admin/faq", label: "FAQ", icon: Bell },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/roles", label: "Roles & Permissions", icon: Shield },
      { href: "/admin/logs", label: "System Logs", icon: ScrollText },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
    <aside className="flex h-screen w-[230px] shrink-0 flex-col bg-[#001E5A] text-white">
      <div className="shrink-0 border-b border-white/10 px-3 pb-5 pt-6">
        <BrandMark variant="sidebar" />
      </div>

      <nav className="admin-sidebar-nav min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium leading-snug transition-colors",
                      active
                        ? "bg-[#0057FF] text-white shadow-sm"
                        : "text-white/80 hover:bg-white/[0.07] hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 stroke-[1.75]" />
                    <span className="min-w-0 flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 bg-[#001E5A] px-3 py-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0 stroke-[1.75]" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
