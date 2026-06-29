import Link from "next/link";
import {
  AdminNotice,
  AdminPageHeader,
  AdminWidget,
} from "@/components/admin/AdminChrome";
import { StaffUserForm } from "@/components/admin/StaffUserForm";
import type { StaffRole } from "@/lib/supabase/auth";

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

export function AdminDashboard({ stats, role, email, forbidden }: Props) {
  const local = email.split("@")[0] ?? "there";
  const name = local.charAt(0).toUpperCase() + local.slice(1);

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

      <div className="admin-dashboard-columns">
        <div>
          <AdminWidget title="At a Glance">
            <ul className="admin-glance-list">
              <li>
                <Link href="/admin/tours">
                  <strong>{stats.publishedTours}</strong> published tour
                  {stats.publishedTours === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/blog">
                  <strong>{stats.publishedPosts}</strong> published post
                  {stats.publishedPosts === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/bookings">
                  <strong>{stats.pendingBookings}</strong> pending booking
                  {stats.pendingBookings === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/tickets">
                  <strong>{stats.pendingTicketRequests}</strong> pending ticket request
                  {stats.pendingTicketRequests === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/consultations">
                  <strong>{stats.pendingConsultations}</strong> pending consultation
                  {stats.pendingConsultations === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/messages">
                  <strong>{stats.pendingMessages}</strong> unread message
                  {stats.pendingMessages === 1 ? "" : "s"}
                </Link>
              </li>
              <li>
                <Link href="/admin/newsletter">
                  <strong>{stats.subscribers}</strong> newsletter subscriber
                  {stats.subscribers === 1 ? "" : "s"}
                </Link>
              </li>
            </ul>
          </AdminWidget>

          <AdminWidget title="Quick Draft">
            <p className="mb-3 text-[#646970]">
              Jump straight to common tasks.
            </p>
            <p className="mb-2">
              <Link href="/admin/tours/new" className="admin-button-primary">
                Add new tour
              </Link>
            </p>
            <p className="mb-2">
              <Link href="/admin/blog/new" className="admin-button-secondary">
                Add new post
              </Link>
            </p>
            {role === "admin" ? (
              <p>
                <Link href="/admin/users/new" className="admin-button-secondary">
                  Add dashboard user
                </Link>
              </p>
            ) : null}
            <p>
              <Link href="/admin/about/new" className="admin-button-secondary">
                Add About page profile
              </Link>
            </p>
          </AdminWidget>
        </div>

        <div>
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

          {role === "admin" ? (
            <AdminWidget title="Dashboard users">
              <p className="admin-field-hint mt-0">
                <strong className="text-[#1d2327]">{stats.staffUsers}</strong> active staff
                account{stats.staffUsers === 1 ? "" : "s"} with admin access.
              </p>
              <div className="mt-4 border-t border-[#f0f0f1] pt-4">
                <p className="mb-3 text-[13px] font-semibold text-[#1d2327]">
                  Add dashboard user
                </p>
                <StaffUserForm variant="compact" showCancel={false} />
              </div>
              <p className="mt-4 border-t border-[#f0f0f1] pt-3">
                <Link href="/admin/users">Manage all users</Link>
              </p>
            </AdminWidget>
          ) : null}

          <AdminWidget title="About page team">
            <p className="admin-field-hint mt-0">
              <strong className="text-[#1d2327]">{stats.aboutTeamMembers}</strong> published
              profile{stats.aboutTeamMembers === 1 ? "" : "s"} on{" "}
              <Link href="/about" target="_blank">
                /about
              </Link>
              .
            </p>
            <p className="mt-4 border-t border-[#f0f0f1] pt-3">
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
