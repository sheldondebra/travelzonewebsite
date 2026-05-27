"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Receipt, Tag, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/layout/empty-state";
import { FilterPills } from "@/components/layout/filter-pills";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/layout/stat-card";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { EXPENSE_CATEGORIES } from "@/server/validations/expense";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
};

export function ExpensesManager() {
  const queryClient = useQueryClient();
  const { formatMoney } = useBusinessSettings();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Miscellaneous");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const { data: allForStats = [] } = useQuery({
    queryKey: ["expenses", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/expenses");
      return parseApiResponse<Expense[]>(res);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", page, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (filter !== "all") params.set("category", filter);
      const res = await fetch(`/api/expenses?${params}`);
      return parseApiResponse<Paginated<Expense>>(res);
    },
  });

  const expenses = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      amount: number;
      category: string;
      notes?: string;
    }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse<Expense>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense recorded");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = allForStats.reduce((s, e) => s + e.amount, 0);
  const thisMonth = allForStats.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  const categories = [...new Set(allForStats.map((e) => e.category))];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      title: form.get("title") as string,
      amount: Number(form.get("amount")),
      category,
      notes: (form.get("notes") as string) || undefined,
    });
  }

  const filterOptions = [
    { value: "all", label: "All" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <PageShell>
      <PageHeader
        title="Expenses"
        description="Track operating costs to see accurate net profit on reports."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button className="touch-manipulation">
                <Plus className="mr-2 size-4" />
                Add expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required placeholder="Rent, fuel, supplies…" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v ?? "Miscellaneous")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input id="notes" name="notes" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  Save expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total expenses"
          value={formatMoney(total)}
          sub={`${allForStats.length} recorded`}
          icon={Wallet}
          highlight
        />
        <StatCard
          label="This month"
          value={formatMoney(monthTotal)}
          sub={`${thisMonth.length} entries`}
          icon={Receipt}
          accent="amber"
        />
        <StatCard
          label="Categories"
          value={String(categories.length)}
          sub="Expense types in use"
          icon={Tag}
          className="sm:col-span-2 lg:col-span-1"
        />
      </section>

      {categories.length > 0 && (
        <FilterPills options={filterOptions} value={filter} onChange={setFilter} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expense history</CardTitle>
          <CardDescription>
            {totalCount} {totalCount === 1 ? "entry" : "entries"}
            {filter !== "all" ? ` in ${filter}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-4">
            <EmptyState
              icon={Wallet}
              title="No expenses yet"
              message="Record your first expense to track net profit accurately."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Add expense
                </Button>
              }
            />
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 lg:hidden">
                {expenses.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{e.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(new Date(e.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-semibold tabular-nums">
                        {formatMoney(e.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{e.category}</Badge>
                      {e.notes && (
                        <span className="text-xs text-muted-foreground">{e.notes}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Title
                      </TableHead>
                      <TableHead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Category
                      </TableHead>
                      <TableHead className="bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Notes
                      </TableHead>
                      <TableHead className="bg-muted/30 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {format(new Date(e.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{e.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{e.category}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {e.notes ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatMoney(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={totalCount}
                onPageChange={setPage}
                itemName="expenses"
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
