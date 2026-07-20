import api from "@/lib/api";

export type LogTab = "activity" | "errors";

export type ActivityLogEntry = {
  id: string;
  type: string;
  level: string;
  message: string;
  subject: string;
  actor?: string | null;
  occurred_at?: string;
  time_ago?: string;
  meta?: Record<string, unknown>;
};

export type ErrorLogEntry = {
  id: string;
  level: string;
  environment?: string;
  message: string;
  stack?: string | null;
  occurred_at?: string;
  time_ago?: string;
};

export type AdminLogsFilters = {
  tab?: LogTab;
  type?: string;
  level?: string;
  search?: string;
};

export type AdminLogsResponse = {
  tab: LogTab;
  entries: ActivityLogEntry[] | ErrorLogEntry[];
  stats: {
    total: number;
    today: number;
    errors: number;
    warnings: number;
  };
  system_health?: {
    server: string;
    database: string;
    queue: string;
    log_file: string;
    log_size: number;
    environment: string;
  };
  meta?: {
    file_size?: number;
    file_updated_at?: string | null;
  };
};

export async function fetchAdminLogs(filters: AdminLogsFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.tab) params.tab = filters.tab;
  if (filters.type && filters.type !== "all") params.type = filters.type;
  if (filters.level && filters.level !== "all") params.level = filters.level;
  if (filters.search) params.search = filters.search;

  const { data } = await api.get<AdminLogsResponse>("/admin/logs", { params });
  return data;
}

export function formatLogBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
