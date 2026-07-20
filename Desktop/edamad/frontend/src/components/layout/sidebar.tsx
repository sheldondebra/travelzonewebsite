"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Radio,
  ShoppingBag,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "My Courses", icon: BookOpen },
  { href: "/courses/store", label: "Course Store", icon: ShoppingBag },
  { href: "/practice", label: "Practice Tests", icon: GraduationCap },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/live-classes", label: "Live Classes", icon: Radio },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/support", label: "Support", icon: HelpCircle },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Admin Home", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/students", label: "Students", icon: User },
  { href: "/admin/reports", label: "Reports", icon: LineChart },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[#002B7F]/10 bg-[#002B7F] text-white">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/70">
          Nursing E-Learning
        </p>
        <h1 className="mt-1 text-xl font-bold">{APP_NAME}</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#0B5FFF] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
