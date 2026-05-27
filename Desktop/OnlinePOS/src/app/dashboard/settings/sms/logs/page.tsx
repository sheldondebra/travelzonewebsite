"use client";

import { useQuery } from "@tanstack/react-query";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type SmsLogRow = {
  id: string;
  recipient: string;
  category: string;
  status: string;
  smsUnits: number;
  message: string;
  errorMessage: string | null;
  createdAt: string;
};

export default function SmsLogsPage() {
  const { data } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: String(DEFAULT_PAGE_SIZE),
      });
      const res = await fetch(`/api/sms/logs?${params}`);
      return parseApiResponse<Paginated<SmsLogRow>>(res);
    },
  });

  const logs = data?.items ?? [];

  return (
    <PageShell>
      <h1 className="text-2xl font-bold tracking-tight">SMS logs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Delivery history for your business
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <ul className="divide-y divide-primary/10">
          {logs.length === 0 ? (
            <li className="p-6 text-sm text-muted-foreground">No SMS sent yet.</li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">{log.recipient}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {log.category}
                  </Badge>
                  <Badge
                    className={
                      log.status === "SENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : log.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : ""
                    }
                  >
                    {log.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")} ·{" "}
                    {log.smsUnits} unit{log.smsUnits === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {log.message}
                </p>
                {log.errorMessage && (
                  <p className="mt-1 text-xs text-red-600">{log.errorMessage}</p>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </PageShell>
  );
}
