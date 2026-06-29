"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiCog6Tooth,
  HiEnvelope,
  HiEnvelopeOpen,
  HiMapPin,
  HiNewspaper,
  HiPaperAirplane,
  HiSquares2X2,
  HiUserGroup,
  HiUsers,
} from "react-icons/hi2";
import type { StaffRole } from "@/lib/supabase/auth";

type MenuItem = {
  href: string;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
  icon: IconType;
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
        icon: HiSquares2X2,
      },
    ],
  },
  {
    items: [
      { href: "/admin/tours", label: "Tours", icon: HiMapPin },
      { href: "/admin/blog", label: "Posts", icon: HiNewspaper },
      { href: "/admin/bookings", label: "Bookings", icon: HiCalendarDays },
      { href: "/admin/tickets", label: "Ticket requests", icon: HiPaperAirplane },
      { href: "/admin/consultations", label: "Consultations", icon: HiChatBubbleLeftRight },
      { href: "/admin/messages", label: "Messages", icon: HiEnvelope },
      { href: "/admin/newsletter", label: "Newsletter", icon: HiEnvelopeOpen },
      { href: "/admin/about", label: "About team", icon: HiUserGroup },
    ],
  },
  {
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        adminOnly: true,
        icon: HiCog6Tooth,
      },
      { href: "/admin/users", label: "Users", adminOnly: true, icon: HiUsers },
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
      <nav className="admin-sidebar-nav" id="admin-sidebar-nav" aria-label="Admin menu">
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
                        <Icon className="admin-sidebar-icon" aria-hidden />
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
