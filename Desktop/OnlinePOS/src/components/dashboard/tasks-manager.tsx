"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Plus,
  Sparkles,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { TaskCard, type TaskItem } from "@/components/dashboard/tasks/task-card";
import { TaskCreateDialog } from "@/components/dashboard/tasks/task-create-dialog";
import {
  TASK_STATUSES,
  statusLabels,
  type TaskStatus,
} from "@/components/dashboard/tasks/tasks-styles";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function TasksManager() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", filter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/tasks?${params}`);
      return parseApiResponse<Paginated<TaskItem>>(res);
    },
  });

  const tasks = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks", "all-stats"],
    queryFn: async () => {
      const res = await fetch("/api/tasks");
      return parseApiResponse<TaskItem[]>(res);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      type?: string;
      dueDate?: string;
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse<TaskItem>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TaskStatus;
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return parseApiResponse<TaskItem>(res);
    },
    onMutate: ({ id }) => setUpdatingId(id),
    onSettled: () => setUpdatingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = allTasks.filter((t) => t.status === "PENDING").length;
  const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = allTasks.filter((t) => t.status === "DONE").length;

  const filterOptions = [
    { value: "all", label: "All", count: allTasks.length },
    ...TASK_STATUSES.map((s) => ({
      value: s,
      label: statusLabels[s],
      count: allTasks.filter((t) => t.status === s).length,
    })),
  ];

  const statTiles = [
    {
      label: "Pending",
      value: pending,
      icon: Timer,
      className: "from-amber-500/20 to-amber-500/5 text-amber-900",
      iconBg: "bg-amber-500/15 text-amber-700",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: ClipboardList,
      className: "from-sky-500/20 to-sky-500/5 text-sky-900",
      iconBg: "bg-sky-500/15 text-sky-700",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle2,
      className: "from-emerald-500/20 to-emerald-500/5 text-emerald-900",
      iconBg: "bg-emerald-500/15 text-emerald-700",
    },
  ];

  return (
    <PageShell size="wide" className="pb-28 lg:pb-8">
      {/* Hero header */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/35 via-brand-rose/45 to-brand-cream px-4 py-5 shadow-soft sm:px-6 sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/25 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-sm sm:size-14">
              <ClipboardList className="size-6 text-primary-foreground sm:size-7" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Team workflow
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Tasks</h1>
              <p className="mt-0.5 max-w-md text-sm text-foreground/70">
                Packing, delivery, inventory, and follow-ups in one place.
              </p>
            </div>
          </div>
          <Button
            className="hidden h-11 shrink-0 rounded-xl px-5 font-semibold shadow-soft sm:inline-flex"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            New task
          </Button>
        </div>
      </header>

      {/* Stats — horizontal scroll on mobile */}
      <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {statTiles.map(({ label, value, icon: Icon, className, iconBg }) => (
          <div
            key={label}
            className={cn(
              "flex min-w-[9.5rem] shrink-0 flex-1 items-center gap-3 rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-card sm:min-w-0",
              className,
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                iconBg,
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                {label}
              </p>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-primary/10 bg-white/90 px-1 py-2 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterOptions.map((opt) => {
            const active = filter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all touch-manipulation",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/30"
                    : "border border-primary/15 bg-white text-muted-foreground hover:border-primary/30 hover:bg-brand-rose/30 hover:text-foreground",
                )}
              >
                {opt.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {filter === "all" ? "All tasks" : statusLabels[filter as TaskStatus]}
          </h2>
          <span className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? "task" : "tasks"}
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-gradient-to-br from-brand-cream/80 to-brand-rose/30"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/20 bg-brand-cream/30 px-4 py-10">
            <EmptyState
              icon={Sparkles}
              title="No tasks yet"
              message="Create tasks for your team to track packing, delivery, and follow-ups."
              action={
                <Button
                  className="rounded-xl"
                  onClick={() => setOpen(true)}
                >
                  <Plus className="mr-2 size-4" />
                  New task
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                updating={updatingId === task.id}
                onStatusChange={(status) =>
                  updateMutation.mutate({ id: task.id, status })
                }
              />
            ))}
          </div>
        )}

        {!isLoading && tasks.length > 0 && (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={totalCount}
            onPageChange={setPage}
            itemName="tasks"
            className="rounded-2xl border border-primary/10 bg-white/80"
          />
        )}
      </section>

      {/* Mobile FAB */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-gradient-to-t from-white via-white/95 to-white/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] lg:hidden">
        <Button
          className="h-12 w-full rounded-2xl text-base font-semibold shadow-soft"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-2 size-5" />
          New task
        </Button>
      </div>

      <TaskCreateDialog
        open={open}
        onOpenChange={setOpen}
        loading={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </PageShell>
  );
}
