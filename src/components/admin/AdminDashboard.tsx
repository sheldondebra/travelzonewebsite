import Link from "next/link";
import {
  AdminNotice,
  AdminPageHeader,
  AdminWidget,
} from "@/components/admin/AdminChrome";
import type { StaffRole } from "@/lib/supabase/auth";

export type DashboardStats = {
  publishedTours: number;
  publishedPosts: number;
  pendingBookings: number;
  pendingConsultations: number;
  pendingMessages: number;
  subscribers: number;
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
            <p>
              <Link href="/admin/blog/new" className="admin-button-secondary">
                Add new post
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
                <Link href="/admin/consultations">Consultations</Link>
              </li>
              <li>
                <Link href="/admin/messages">Messages</Link>
              </li>
              <li>
                <Link href="/admin/newsletter">Newsletter</Link>
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
