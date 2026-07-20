"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  MessageSquare,
  Search,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  deleteAdminTicket,
  fetchAdminTicket,
  fetchAdminTickets,
  updateAdminTicket,
  type AdminTicket,
  type AdminTicketUpdatePayload,
  type TicketPriority,
  type TicketStatus,
} from "@/services/admin-tickets";

const priorityStyles: Record<TicketPriority, string> = {
  High: "bg-[#FEE2E2] text-[#991B1B]",
  Medium: "bg-[#FFEDD5] text-[#9A3412]",
  Low: "bg-[#DCFCE7] text-[#166534]",
};

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-[#FEE2E2] text-[#991B1B]",
  "In Progress": "bg-[#FFEDD5] text-[#9A3412]",
  Resolved: "bg-[#DCFCE7] text-[#166534]",
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function categoryLabel(category?: string | null) {
  if (!category || category === "general") return "General";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function AdminTicketsView() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TicketPriority>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AdminTicketUpdatePayload>({});

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "Open").length,
      inProgress: tickets.filter((t) => t.status === "In Progress").length,
      resolved: tickets.filter((t) => t.status === "Resolved").length,
    }),
    [tickets],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminTickets({
      search: search || undefined,
      status: statusFilter,
      priority: priorityFilter,
    })
      .then(setTickets)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load tickets."));
        setTickets([]);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(ticket: AdminTicket) {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelected(ticket);
    setForm({
      status: ticket.status,
      priority: ticket.priority,
      admin_notes: ticket.admin_notes ?? "",
    });

    try {
      const full = await fetchAdminTicket(ticket.ticket_id);
      setSelected(full);
      setForm({
        status: full.status,
        priority: full.priority,
        admin_notes: full.admin_notes ?? "",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load ticket details."));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelected(null);
    setForm({});
  }

  async function handleSave() {
    if (!selected) return;

    setSaving(true);
    try {
      const res = await updateAdminTicket(selected.ticket_id, form);
      toast.success(res.message);
      setSelected(res.ticket);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update ticket."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ticket: AdminTicket) {
    if (!window.confirm(`Delete ticket ${ticket.id}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteAdminTicket(ticket.ticket_id);
      toast.success(res.message);
      if (selected?.ticket_id === ticket.ticket_id) {
        closeDetail();
      }
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete ticket."));
    }
  }

  async function quickStatusChange(ticket: AdminTicket, status: TicketStatus) {
    try {
      const res = await updateAdminTicket(ticket.ticket_id, { status });
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update ticket status."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Support Tickets</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Review student support requests, update status, and add internal notes.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total tickets", value: stats.total, icon: Ticket },
          { label: "Open", value: stats.open, icon: AlertCircle },
          { label: "In progress", value: stats.inProgress, icon: Clock },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2 },
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
            placeholder="Search tickets, users, messages..."
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
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          className="ed-input w-auto min-w-[140px]"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
        >
          <option value="all">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">No support tickets found.</div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-3 py-3 font-medium">Subject</th>
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.ticket_id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                    <td className="px-5 py-3 font-medium text-[#002B7F]">{ticket.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[#374151]">{ticket.subject}</p>
                      {ticket.message ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-[#9CA3AF]">{ticket.message}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[#374151]">{ticket.user}</p>
                      {ticket.email ? <p className="text-[11px] text-[#9CA3AF]">{ticket.email}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityStyles[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="ed-input h-8 min-w-[130px] py-0 text-[12px]"
                        value={ticket.status}
                        onChange={(e) => void quickStatusChange(ticket, e.target.value as TicketStatus)}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-[#9CA3AF]">{ticket.date}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          title="View ticket"
                          aria-label="View ticket"
                          onClick={() => void openDetail(ticket)}
                          className="rounded-lg p-2 text-[#0057FF] transition-colors hover:bg-[#EBF2FF]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete ticket"
                          aria-label="Delete ticket"
                          onClick={() => void handleDelete(ticket)}
                          className="rounded-lg p-2 text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium text-[#0057FF]">{selected.id}</p>
                  <h2 className="text-[17px] font-bold text-[#002B7F]">{selected.subject}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityStyles[selected.priority]}`}>
                    {selected.priority}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {detailLoading ? (
                <p className="text-[13px] text-[#6B7280]">Loading ticket details...</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[10px] border border-[#E5EAF2] p-3">
                      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                        <User className="h-3.5 w-3.5" />
                        Submitted by
                      </div>
                      <p className="text-[13px] font-medium text-[#002B7F]">{selected.user}</p>
                      {selected.email ? (
                        <a href={`mailto:${selected.email}`} className="mt-1 flex items-center gap-1 text-[12px] text-[#0057FF] hover:underline">
                          <Mail className="h-3.5 w-3.5" />
                          {selected.email}
                        </a>
                      ) : null}
                    </div>
                    <div className="rounded-[10px] border border-[#E5EAF2] p-3">
                      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Category
                      </div>
                      <p className="text-[13px] font-medium text-[#374151]">{categoryLabel(selected.category)}</p>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">Created {formatDateTime(selected.created_at)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[12px] font-semibold text-[#002B7F]">Student message</p>
                    <div className="rounded-[10px] bg-[#F7F9FC] p-4 text-[13px] leading-relaxed text-[#374151] whitespace-pre-wrap">
                      {selected.message || "No message provided."}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Status</label>
                      <select
                        className="ed-input w-full"
                        value={form.status ?? selected.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TicketStatus }))}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Priority</label>
                      <select
                        className="ed-input w-full"
                        value={form.priority ?? selected.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Internal admin notes</label>
                    <textarea
                      className="ed-input min-h-[100px] w-full resize-y py-2"
                      value={form.admin_notes ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))}
                      placeholder="Notes visible only to admins..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button
                type="button"
                onClick={() => void handleDelete(selected)}
                className="ed-btn-outline border-[#FECACA] text-[13px] text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={closeDetail} className="ed-btn-outline text-[13px]" disabled={saving}>
                  Close
                </button>
                <button type="button" onClick={() => void handleSave()} className="ed-btn-primary text-[13px]" disabled={saving || detailLoading}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
