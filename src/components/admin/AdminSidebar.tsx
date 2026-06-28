"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { StaffRole } from "@/lib/supabase/auth";
import {
  BookingsIcon,
  ConsultationsIcon,
  ContactMessagesIcon,
  DashboardIcon,
  NewsletterIcon,
  PostsIcon,
  SettingsIcon,
  ToursIcon,
  UsersIcon,
} from "@/components/admin/AdminSidebarIcons";

type MenuItem = {
  href: string;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
  icon: ComponentType<{ className?: string }>;
};

type MenuSection = {
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        exact: true,
        icon: DashboardIcon,
      },
    ],
  },
  {
    items: [
      { href: "/admin/tours", label: "Tours", icon: ToursIcon },
      { href: "/admin/blog", label: "Posts", icon: PostsIcon },
      { href: "/admin/bookings", label: "Bookings", icon: BookingsIcon },
      { href: "/admin/consultations", label: "Consultations", icon: ConsultationsIcon },
      { href: "/admin/messages", label: "Messages", icon: ContactMessagesIcon },
      { href: "/admin/newsletter", label: "Newsletter", icon: NewsletterIcon },
    ],
  },
  {
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        adminOnly: true,
        icon: SettingsIcon,
      },
      { href: "/admin/users", label: "Users", adminOnly: true, icon: UsersIcon },
    ],
  },
];

type Props = {
  role: StaffRole;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ role }: Props) {
  const pathname = usePathname();

  const visibleSections = menuSections
    .map((section) => ({
      items: section.items.filter((item) => !item.adminOnly || role === "admin"),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav" aria-label="Admin menu">
        <ul className="m-0 list-none p-0">
          {visibleSections.map((section, sectionIndex) => (
            <li key={sectionIndex}>
              {sectionIndex > 0 ? (
                <div className="admin-sidebar-separator" aria-hidden />
              ) : null}
              <ul className="m-0 list-none p-0">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href, item.exact);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`admin-sidebar-link ${active ? "admin-sidebar-link-active" : ""}`}
                      >
                        <Icon className="admin-sidebar-icon" />
                        <span className="admin-sidebar-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
