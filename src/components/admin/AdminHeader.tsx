"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  HiArrowRightOnRectangle,
  HiArrowTopRightOnSquare,
  HiBars3,
  HiBell,
  HiChevronDown,
  HiCog6Tooth,
  HiEnvelope,
} from "react-icons/hi2";
import { logoutAction } from "@/app/admin/actions/auth";
import { AdminHeaderSmsBalance } from "@/components/admin/AdminHeaderSmsBalance";
import type { SplitSmsBalance } from "@/lib/splitsms";
import type { StaffRole } from "@/lib/auth/staff";

export type AdminHeaderNotifications = {
  pendingBookings: number;
  pendingTicketRequests: number;
  pendingConsultations: number;
  pendingMessages: number;
};

type Props = {
  email: string;
  role: StaffRole;
  splitsmsReady: boolean;
  smsBalance: SplitSmsBalance | null;
  smsBalanceError: string | null;
  notifications: AdminHeaderNotifications;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

function getAvatarInitials(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }

  return local.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);

  if (!parts.length) return email;

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBadgeCount(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

export function AdminHeader({
  email,
  role,
  splitsmsReady,
  smsBalance,
  smsBalanceError,
  notifications,
  menuOpen = false,
  onMenuToggle,
}: Props) {
  const initials = getAvatarInitials(email);
  const displayName = getDisplayName(email);
  const notificationTotal =
    notifications.pendingBookings +
    notifications.pendingTicketRequests +
    notifications.pendingConsultations +
    notifications.pendingMessages;

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsMenuId = useId();
  const accountMenuId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const notificationItems = [
    {
      href: "/admin/bookings",
      label: "Pending bookings",
      count: notifications.pendingBookings,
    },
    {
      href: "/admin/tickets",
      label: "Ticket requests",
      count: notifications.pendingTicketRequests,
    },
    {
      href: "/admin/consultations",
      label: "Consultations",
      count: notifications.pendingConsultations,
    },
    {
      href: "/admin/messages",
      label: "Unread messages",
      count: notifications.pendingMessages,
    },
  ];

  return (
    <header className="admin-bar">
      <div className="admin-bar-brand">
        {onMenuToggle ? (
          <button
            type="button"
            className="admin-bar-icon-btn md:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar-nav"
            aria-label="Open menu"
            onClick={onMenuToggle}
          >
            <HiBars3 className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <Link href="/admin" className="admin-bar-brand-link">
          <span className="admin-bar-brand-badge">Admin</span>
        </Link>

        <Link
          href="/"
          target="_blank"
          className="admin-bar-icon-btn hidden sm:inline-flex"
          aria-label="Visit site"
          title="Visit site"
        >
          <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="admin-bar-actions">
        <AdminHeaderSmsBalance
          role={role}
          splitsmsReady={splitsmsReady}
          initialBalance={smsBalance}
          initialError={smsBalanceError}
        />

        <Link
          href="/admin/messages"
          className="admin-bar-icon-btn"
          aria-label={
            notifications.pendingMessages > 0
              ? `${notifications.pendingMessages} unread messages`
              : "Messages"
          }
          title="Messages"
        >
          <HiEnvelope className="h-5 w-5" aria-hidden />
          {formatBadgeCount(notifications.pendingMessages) ? (
            <span className="admin-bar-icon-badge">
              {formatBadgeCount(notifications.pendingMessages)}
            </span>
          ) : null}
        </Link>

        <div className="admin-bar-menu-wrap" ref={notificationsRef}>
          <button
            type="button"
            className="admin-bar-icon-btn"
            aria-label={
              notificationTotal > 0
                ? `${notificationTotal} notifications`
                : "Notifications"
            }
            aria-expanded={notificationsOpen}
            aria-controls={notificationsMenuId}
            title="Notifications"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setAccountOpen(false);
            }}
          >
            <HiBell className="h-5 w-5" aria-hidden />
            {formatBadgeCount(notificationTotal) ? (
              <span className="admin-bar-icon-badge">
                {formatBadgeCount(notificationTotal)}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div
              id={notificationsMenuId}
              className="admin-bar-dropdown"
              role="menu"
            >
              <div className="admin-bar-dropdown-head">
                <p className="admin-bar-dropdown-title">Notifications</p>
                <p className="admin-bar-dropdown-subtitle">
                  {notificationTotal > 0
                    ? `${notificationTotal} item${notificationTotal === 1 ? "" : "s"} need attention`
                    : "You're all caught up"}
                </p>
              </div>
              <ul className="admin-bar-dropdown-list">
                {notificationItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="admin-bar-dropdown-item"
                      role="menuitem"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <span>{item.label}</span>
                      <span className="admin-bar-dropdown-count">{item.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="admin-bar-menu-wrap" ref={accountRef}>
          <button
            type="button"
            className="admin-bar-avatar-btn"
            aria-label="Account menu"
            aria-expanded={accountOpen}
            aria-controls={accountMenuId}
            onClick={() => {
              setAccountOpen((open) => !open);
              setNotificationsOpen(false);
            }}
          >
            <span className="admin-bar-avatar" aria-hidden>
              {initials}
            </span>
            <span className="admin-bar-user-meta">
              <span className="admin-bar-user-name">{displayName}</span>
              <span className="admin-bar-user-role">{role}</span>
            </span>
            <HiChevronDown
              className={`admin-bar-chevron ${accountOpen ? "admin-bar-chevron-open" : ""}`}
              aria-hidden
            />
          </button>

          {accountOpen ? (
            <div id={accountMenuId} className="admin-bar-dropdown admin-bar-dropdown-account" role="menu">
              <div className="admin-bar-dropdown-head">
                <p className="admin-bar-dropdown-title">{displayName}</p>
                <p className="admin-bar-dropdown-subtitle truncate" title={email}>
                  {email}
                </p>
              </div>
              <ul className="admin-bar-dropdown-list">
                {role === "admin" ? (
                  <li>
                    <Link
                      href="/admin/settings"
                      className="admin-bar-dropdown-item"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      <HiCog6Tooth className="h-4 w-4" aria-hidden />
                      <span>Settings</span>
                    </Link>
                  </li>
                ) : null}
                <li>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="admin-bar-dropdown-item admin-bar-dropdown-danger"
                      role="menuitem"
                    >
                      <HiArrowRightOnRectangle className="h-4 w-4" aria-hidden />
                      <span>Log out</span>
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="admin-bar-icon-btn"
            aria-label="Log out"
            title="Log out"
          >
            <HiArrowRightOnRectangle className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>
    </header>
  );
}
