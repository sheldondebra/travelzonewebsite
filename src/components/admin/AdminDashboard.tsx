import Link from "next/link";
import {
  AdminNotice,
  AdminPageHeader,
  AdminWidget,
} from "@/components/admin/AdminChrome";
import { StaffUserForm } from "@/components/admin/StaffUserForm";
import type { StaffRole } from "@/lib/auth/staff";

export type DashboardStats = {
  publishedTours: number;
  publishedPosts: number;
  pendingBookings: number;
  pendingTicketRequests: number;
  pendingConsultations: number;
  pendingMessages: number;
  subscribers: number;
  staffUsers: number;
  aboutTeamMembers: number;
};

type Props = {
  stats: DashboardStats;
  role: StaffRole;
  email: string;
  forbidden?: boolean;
};

type StatTile = {
  label: string;
  value: number;
  href: string;
  hint: string;
  highlight?: boolean;
};

export function AdminDashboard({ stats, role, email, forbidden }: Props) {
  const local = email.split("@")[0] ?? "there";
  const name = local.charAt(0).toUpperCase() + local.slice(1);

  const priorityStats: StatTile[] = [
    {
      label: "Pending bookings",
      value: stats.pendingBookings,
      href: "/admin/bookings",
      hint: "Needs attention",
      highlight: stats.pendingBookings > 0,
    },
    {
      label: "Ticket requests",
      value: stats.pendingTicketRequests,
      href: "/admin/tickets",
      hint: "Awaiting reply",
      highlight: stats.pendingTicketRequests > 0,
    },
    {
      label: "Consultations",
      value: stats.pendingConsultations,
      href: "/admin/consultations",
      hint: "Pending",
      highlight: stats.pendingConsultations > 0,
    },
    {
      label: "Unread messages",
      value: stats.pendingMessages,
      href: "/admin/messages",
      hint: "Inbox",
      highlight: stats.pendingMessages > 0,
    },
  ];

  const secondaryStats: StatTile[] = [
    {
      label: "Published tours",
      value: stats.publishedTours,
      href: "/admin/tours",
      hint: "Live on site",
    },
    {
      label: "Published posts",
      value: stats.publishedPosts,
      href: "/admin/blog",
      hint: "Blog",
    },
    {
      label: "Subscribers",
      value: stats.subscribers,
      href: "/admin/newsletter",
      hint: "Newsletter",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${name}.`}
      />

      {forbidden ? (
        <AdminNotice variant="error">
          You do not have permission to access that page.
        </AdminNotice>
      ) : null}

      <div className="admin-stat-grid">
        {[...priorityStats, ...secondaryStats].map((tile) => (
          <Link
            key={tile.href + tile.label}
            href={tile.href}
            className={`admin-stat-tile ${tile.highlight ? "admin-stat-tile-highlight" : ""}`.trim()}
          >
            <span className="admin-stat-tile-label">{tile.label}</span>
            <span className="admin-stat-tile-value">{tile.value}</span>
            <span className="admin-stat-tile-hint">{tile.hint}</span>
          </Link>
        ))}
      </div>

      <div className="admin-dashboard-columns">
        <div>
          <AdminWidget title="Quick actions">
            <p className="admin-field-hint mt-0 mb-4">
              Jump straight to common tasks.
            </p>
            <div className="admin-quick-actions">
              <Link href="/admin/tours/new" className="admin-button-primary">
                Add new tour
              </Link>
              <Link href="/admin/blog/new" className="admin-button-secondary">
                Add new post
              </Link>
              <Link href="/admin/about/new" className="admin-button-secondary">
                Add About profile
              </Link>
              {role === "admin" ? (
                <Link href="/admin/users/new" className="admin-button-secondary">
                  Add dashboard user
                </Link>
              ) : null}
            </div>
          </AdminWidget>

          <AdminWidget title="Quick Links">
            <ul className="admin-quick-links">
              <li>
                <Link href="/admin/tours">All tours</Link>
              </li>
              <li>
                <Link href="/admin/blog">All posts</Link>
              </li>
              <li>
                <Link href="/admin/bookings">Bookings</Link>
              </li>
              <li>
                <Link href="/admin/tickets">Ticket requests</Link>
              </li>
              <li>
                <Link href="/admin/consultations">Consultations</Link>
              </li>
              <li>
                <Link href="/admin/messages">Messages</Link>
              </li>
              <li>
                <Link href="/admin/newsletter">Newsletter</Link>
              </li>
              <li>
                <Link href="/admin/about">About team</Link>
              </li>
              {role === "admin" ? (
                <>
                  <li>
                    <Link href="/admin/settings">Settings</Link>
                  </li>
                  <li>
                    <Link href="/admin/users">Users</Link>
                  </li>
                </>
              ) : null}
            </ul>
          </AdminWidget>
        </div>

        <div>
          {role === "admin" ? (
            <AdminWidget title="Dashboard users">
              <p className="admin-field-hint mt-0">
                <strong className="text-navy">{stats.staffUsers}</strong> active staff
                account{stats.staffUsers === 1 ? "" : "s"} with admin access.
              </p>
              <div className="mt-4 border-t border-[#f3efe8] pt-4">
                <p className="mb-3 text-[13px] font-semibold text-navy">
                  Add dashboard user
                </p>
                <StaffUserForm variant="compact" showCancel={false} />
              </div>
              <p className="mt-4 border-t border-[#f3efe8] pt-3">
                <Link href="/admin/users">Manage all users</Link>
              </p>
            </AdminWidget>
          ) : null}

          <AdminWidget title="About page team">
            <p className="admin-field-hint mt-0">
              <strong className="text-navy">{stats.aboutTeamMembers}</strong> published
              profile{stats.aboutTeamMembers === 1 ? "" : "s"} on{" "}
              <Link href="/about" target="_blank">
                /about
              </Link>
              .
            </p>
            <p className="mt-4 border-t border-[#f3efe8] pt-3">
              <Link href="/admin/about">Manage About page team</Link>
            </p>
          </AdminWidget>

          <AdminWidget title="Site">
            <ul className="admin-quick-links">
              <li>
                <Link href="/" target="_blank">
                  View homepage
                </Link>
              </li>
              <li>
                <Link href="/book" target="_blank">
                  View book page
                </Link>
              </li>
              <li>
                <Link href="/consultation" target="_blank">
                  View consultation page
                </Link>
              </li>
              <li>
                <Link href="/blog" target="_blank">
                  View blog
                </Link>
              </li>
            </ul>
          </AdminWidget>
        </div>
      </div>
    </>
  );
}
