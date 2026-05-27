"use client";

import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  PlayCircle,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TASK_STATUSES,
  statusConfig,
  statusLabels,
  taskTypeMeta,
  type TaskStatus,
} from "@/components/dashboard/tasks/tasks-styles";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  assignee: { name: string | null } | null;
};

const statusShort: Record<TaskStatus, string> = {
  PENDING: "Wait",
  IN_PROGRESS: "Active",
  DONE: "Done",
  CANCELLED: "Cancel",
};

const statusIcons: Record<TaskStatus, typeof Circle> = {
  PENDING: Circle,
  IN_PROGRESS: PlayCircle,
  DONE: CheckCircle2,
  CANCELLED: XCircle,
};

type Props = {
  task: TaskItem;
  updating?: boolean;
  onStatusChange: (status: TaskStatus) => void;
};

export function TaskCard({ task, updating, onStatusChange }: Props) {
  const status = task.status as TaskStatus;
  const cfg = statusConfig[status] ?? statusConfig.PENDING;
  const meta = taskTypeMeta(task.type);
  const TypeIcon = meta.icon;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueOverdue =
    due && status !== "DONE" && status !== "CANCELLED" && isPast(due) && !isToday(due);
  const dueToday = due && isToday(due);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-primary/10 bg-white/95 shadow-card transition-all",
        "hover:border-primary/25 hover:shadow-soft",
        "border-l-4",
        cfg.border,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-cream/30 via-transparent to-brand-rose/20 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:size-12",
              meta.tone,
            )}
          >
            <TypeIcon className="size-5 sm:size-[1.35rem]" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight sm:text-base">
                {task.title}
              </h3>
              {updating && (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              )}
            </div>

            {task.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                  cfg.badge,
                )}
              >
                <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", cfg.dot)} />
                {statusLabels[status] ?? task.status}
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  meta.tone,
                )}
              >
                {meta.label}
              </span>
              {due && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium",
                    dueOverdue
                      ? "text-red-700"
                      : dueToday
                        ? "text-amber-800"
                        : "text-muted-foreground",
                  )}
                >
                  <Calendar className="size-3" />
                  {dueOverdue ? "Overdue · " : dueToday ? "Today · " : "Due "}
                  {format(due, "MMM d")}
                </span>
              )}
              {task.assignee?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="size-3" />
                  {task.assignee.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-4 grid grid-cols-4 gap-1.5 sm:gap-2"
          role="group"
          aria-label="Update status"
        >
          {TASK_STATUSES.map((s) => {
            const active = status === s;
            const Icon = statusIcons[s];
            const chip = statusConfig[s];
            return (
              <button
                key={s}
                type="button"
                disabled={updating}
                onClick={() => onStatusChange(s)}
                className={cn(
                  "flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-xl border text-[10px] font-semibold transition-all touch-manipulation sm:min-h-[3rem] sm:text-xs",
                  active ? chip.chipActive : chip.chip,
                )}
              >
                <Icon className="size-4 sm:size-[1.125rem]" strokeWidth={active ? 2.25 : 1.75} />
                <span className="truncate text-[10px] sm:text-xs">
                  {statusShort[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
