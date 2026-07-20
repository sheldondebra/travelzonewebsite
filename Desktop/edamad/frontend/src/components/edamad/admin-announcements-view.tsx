"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Mail,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  publishAdminAnnouncement,
  updateAdminAnnouncement,
  type AdminAnnouncement,
  type AdminAnnouncementPayload,
} from "@/services/admin-announcements";

const emptyForm: AdminAnnouncementPayload = {
  title: "",
  body: "",
  audience: "all",
};

const audienceLabels: Record<AdminAnnouncementPayload["audience"], string> = {
  all: "All users",
  students: "Students only",
  admins: "Admins only",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionIcon({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "default" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "text-[#16A34A] hover:bg-[#F0FDF4]"
      : tone === "warning"
        ? "text-[#D97706] hover:bg-[#FFFBEB]"
        : tone === "danger"
          ? "text-[#DC2626] hover:bg-[#FEF2F2]"
          : "text-[#0057FF] hover:bg-[#EBF2FF]";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function AdminAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<AdminAnnouncementPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const stats = useMemo(
    () => ({
      total: announcements.length,
      published: announcements.filter((a) => a.status === "published").length,
      draft: announcements.filter((a) => a.status === "draft").length,
      emailsSent: announcements.reduce((sum, a) => sum + a.emails_sent_count, 0),
    }),
    [announcements],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminAnnouncements({
      search: search || undefined,
      status: statusFilter,
    })
      .then(setAnnouncements)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load announcements."));
        setAnnouncements([]);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(announcement: AdminAnnouncement) {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.body.trim()) {
      toast.error("Message body is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateAdminAnnouncement(editing.id, form);
        toast.success(res.message);
      } else {
        const res = await createAdminAnnouncement(form);
        toast.success(res.message);
      }
      closeModal();
      load();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, editing ? "Failed to update announcement." : "Failed to create announcement."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(announcement: AdminAnnouncement, resend = false) {
    const audienceLabel = audienceLabels[announcement.audience];
    const action = resend ? "Resend this announcement" : "Publish and send";
    const confirmed = window.confirm(
      `${action} to ${audienceLabel.toLowerCase()}?\n\n"${announcement.title}"\n\nEmails will be sent to all matching accounts and the announcement will appear on user dashboards.`,
    );
    if (!confirmed) return;

    setPublishingId(announcement.id);
    try {
      const res = await publishAdminAnnouncement(announcement.id, resend);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to publish announcement."));
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(announcement: AdminAnnouncement) {
    if (!window.confirm(`Delete announcement "${announcement.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteAdminAnnouncement(announcement.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete announcement."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Announcements</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Broadcast updates to students and staff. Publishing sends emails and shows announcements on user accounts.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="ed-btn-primary gap-2 text-[13px]">
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Megaphone },
          { label: "Published", value: stats.published, icon: Bell },
          { label: "Drafts", value: stats.draft, icon: Pencil },
          { label: "Emails sent", value: stats.emailsSent, icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="ed-card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none text-[#002B7F]">{value.toLocaleString()}</p>
              <p className="mt-1 text-[12px] text-[#6B7280]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          className="ed-input w-auto min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">
          No announcements found.{" "}
          <button type="button" onClick={openCreate} className="font-medium text-[#0057FF] hover:underline">
            Create your first announcement
          </button>
        </div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Announcement</th>
                  <th className="px-3 py-3 font-medium">Audience</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Emails</th>
                  <th className="px-3 py-3 font-medium">Published</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr
                    key={announcement.id}
                    className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
                          <Megaphone className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#002B7F]">{announcement.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9CA3AF]">{announcement.body}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-[#374151]">
                        <Users className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {audienceLabels[announcement.audience]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          announcement.status === "published"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        {announcement.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#374151]">{announcement.emails_sent_count.toLocaleString()}</td>
                    <td className="px-3 py-3 text-[#9CA3AF]">{formatDate(announcement.published_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {announcement.status === "draft" ? (
                          <ActionIcon
                            label="Publish and email users"
                            onClick={() => void handlePublish(announcement)}
                            tone="success"
                          >
                            <Send className={`h-4 w-4 ${publishingId === announcement.id ? "animate-pulse" : ""}`} />
                          </ActionIcon>
                        ) : (
                          <ActionIcon
                            label="Resend emails"
                            onClick={() => void handlePublish(announcement, true)}
                            tone="warning"
                          >
                            <Mail className={`h-4 w-4 ${publishingId === announcement.id ? "animate-pulse" : ""}`} />
                          </ActionIcon>
                        )}
                        <ActionIcon label="Edit announcement" onClick={() => openEdit(announcement)}>
                          <Pencil className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          label="Delete announcement"
                          onClick={() => void handleDelete(announcement)}
                          tone="danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">
                {editing ? "Edit Announcement" : "New Announcement"}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">
                Save as draft first, then publish to email users and show on their dashboard.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">
                  Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  className="ed-input w-full"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. New course materials available"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">
                  Message <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  className="ed-input min-h-[120px] w-full resize-y py-2"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Write the announcement message..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Audience</label>
                <select
                  className="ed-input w-full"
                  value={form.audience}
                  disabled={editing?.status === "published"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, audience: e.target.value as AdminAnnouncementPayload["audience"] }))
                  }
                >
                  <option value="all">All users (students + admins)</option>
                  <option value="students">Students only</option>
                  <option value="admins">Admins only</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={closeModal} className="ed-btn-outline text-[13px]" disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleSubmit()} className="ed-btn-primary text-[13px]" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save changes" : "Save draft"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
