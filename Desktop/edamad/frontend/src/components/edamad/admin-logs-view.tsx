"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Megaphone,
  ScrollText,
  Search,
  Server,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  fetchAdminLogs,
  formatLogBytes,
  type ActivityLogEntry,
  type AdminLogsResponse,
  type ErrorLogEntry,
  type LogTab,
} from "@/services/admin-logs";

const activityIcons: Record<string, typeof User> = {
  user: User,
  course: BookOpen,
  lesson: BookOpen,
  enrollment: GraduationCap,
  ticket: Ticket,
  announcement: Megaphone,
};

const levelStyles: Record<string, string> = {
  info: "bg-[#EBF2FF] text-[#0057FF]",
  success: "bg-[#DCFCE7] text-[#166534]",
  warning: "bg-[#FFEDD5] text-[#9A3412]",
  ERROR: "bg-[#FEE2E2] text-[#991B1B]",
  WARNING: "bg-[#FFEDD5] text-[#9A3412]",
  INFO: "bg-[#EBF2FF] text-[#0057FF]",
  DEBUG: "bg-[#F3F4F6] text-[#6B7280]",
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

export function AdminLogsView() {
  const [tab, setTab] = useState<LogTab>("activity");
  const [data, setData] = useState<AdminLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminLogs({
      tab,
      type: typeFilter,
      level: levelFilter,
      search: search || undefined,
    })
      .then(setData)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load logs."));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [tab, typeFilter, levelFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () =>
      data?.stats ?? {
        total: 0,
        today: 0,
        errors: 0,
        warnings: 0,
      },
    [data],
  );

  const activityEntries = (data?.entries ?? []) as ActivityLogEntry[];
  const errorEntries = (data?.entries ?? []) as ErrorLogEntry[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">System Logs</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Review platform activity and application error logs.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Entries shown", value: stats.total, icon: ScrollText },
          { label: "Today", value: stats.today, icon: Server },
          { label: "Errors", value: stats.errors, icon: XCircle },
          { label: "Warnings", value: stats.warnings, icon: AlertTriangle },
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

      {data?.system_health && tab === "activity" ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Server", value: data.system_health.server },
            { label: "Database", value: data.system_health.database },
            { label: "Environment", value: data.system_health.environment },
            { label: "Log file", value: formatLogBytes(data.system_health.log_size) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[10px] border border-[#E5EAF2] bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
              <p className="mt-1 text-[14px] font-semibold text-[#002B7F]">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(["activity", "errors"] as LogTab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-[10px] px-4 py-2 text-[13px] font-medium transition-colors ${
                tab === id ? "bg-[#0057FF] text-white" : "bg-white text-[#374151] ring-1 ring-[#E5EAF2] hover:bg-[#F7F9FC]"
              }`}
            >
              {id === "activity" ? "Activity" : "Error Logs"}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder={tab === "activity" ? "Search activity..." : "Search error logs..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>

        {tab === "activity" ? (
          <select className="ed-input w-auto min-w-[150px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="user">Users</option>
            <option value="course">Courses</option>
            <option value="lesson">Lessons</option>
            <option value="enrollment">Enrollments</option>
            <option value="ticket">Tickets</option>
            <option value="announcement">Announcements</option>
          </select>
        ) : (
          <select className="ed-input w-auto min-w-[150px]" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">All levels</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
        )}

        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Refresh
        </button>
      </div>

      {tab === "errors" && data?.meta ? (
        <p className="mb-3 text-[12px] text-[#6B7280]">
          Reading tail of <span className="font-mono">storage/logs/laravel.log</span>
          {data.meta.file_updated_at ? ` · Updated ${formatDateTime(data.meta.file_updated_at)}` : ""}
          {data.meta.file_size ? ` · ${formatLogBytes(data.meta.file_size)}` : ""}
        </p>
      ) : null}

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading logs...</div>
      ) : tab === "activity" ? (
        activityEntries.length === 0 ? (
          <div className="ed-card p-8 text-center text-[#6B7280]">No activity found.</div>
        ) : (
          <div className="ed-card overflow-hidden">
            <ul className="divide-y divide-[#E5EAF2]">
              {activityEntries.map((entry) => {
                const Icon = activityIcons[entry.type] ?? ScrollText;
                return (
                  <li key={entry.id} className="flex gap-4 px-5 py-4 hover:bg-[#F7F9FC]/60">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#002B7F]">{entry.message}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${levelStyles[entry.level] ?? levelStyles.info}`}>
                          {entry.type}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[#374151]">{entry.subject}</p>
                      {entry.actor ? <p className="mt-0.5 text-[12px] text-[#6B7280]">By {entry.actor}</p> : null}
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-[#9CA3AF]">
                      <p>{entry.time_ago}</p>
                      <p className="mt-0.5">{formatDateTime(entry.occurred_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      ) : errorEntries.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">
          No error log entries found. With <span className="font-mono">MAIL_MAILER=log</span>, emails also appear here.
        </div>
      ) : (
        <div className="ed-card overflow-hidden">
          <ul className="divide-y divide-[#E5EAF2]">
            {errorEntries.map((entry) => {
              const expanded = expandedError === entry.id;
              return (
                <li key={entry.id} className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedError(expanded ? null : entry.id)}
                    className="flex w-full items-start gap-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#991B1B]">
                      <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${levelStyles[entry.level] ?? levelStyles.ERROR}`}>
                          {entry.level}
                        </span>
                        {entry.environment ? (
                          <span className="text-[10px] uppercase text-[#9CA3AF]">{entry.environment}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13px] font-medium text-[#002B7F]">{entry.message}</p>
                      <p className="mt-1 text-[11px] text-[#9CA3AF]">
                        {entry.time_ago} · {formatDateTime(entry.occurred_at)}
                      </p>
                    </div>
                  </button>
                  {expanded && entry.stack ? (
                    <pre className="mt-3 max-h-64 overflow-auto rounded-[10px] bg-[#0F172A] p-4 text-[11px] leading-relaxed text-[#E2E8F0]">
                      {entry.stack}
                    </pre>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
