"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  MailCheck,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  suspended: boolean;
  createdAt: string;
  business: { id: string; name: string; slug: string } | null;
};

type ListResult = {
  items: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

type Stats = {
  total: number;
  verified: number;
  suspended: number;
  unverified: number;
};

type Tenant = { id: string; name: string; slug: string };

const ROLES = ["OWNER", "MANAGER", "STAFF", "DELIVERY", "CUSTOMER", "PLATFORM_ADMIN"] as const;

export function PlatformUsersManager() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [suspended, setSuspended] = useState("all");
  const [emailVerified, setEmailVerified] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "STAFF",
    businessId: "",
    emailVerified: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-users-stats"],
    queryFn: async () => {
      const res = await fetch("/api/platform/users?stats=1");
      return parseApiResponse<Stats>(res);
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: async () => {
      const res = await fetch("/api/platform/tenants");
      return parseApiResponse<Tenant[]>(res);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["platform-users", page, search, role, businessId, suspended, emailVerified],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        suspended,
        emailVerified,
      });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (businessId) params.set("businessId", businessId);
      const res = await fetch(`/api/platform/users?${params}`);
      return parseApiResponse<ListResult>(res);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          businessId: form.businessId || null,
          name: form.name || undefined,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("User created");
      setCreateOpen(false);
      setForm({
        email: "",
        password: "",
        name: "",
        role: "STAFF",
        businessId: "",
        emailVerified: false,
      });
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      queryClient.invalidateQueries({ queryKey: ["platform-users-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tenantOptions = tenants.filter((t) => t.slug !== "tecunit-general-office");

  return (
    <PageShell size="wide" className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 to-primary/20 text-sky-800">
              <Users className="size-6" />
            </span>
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all app users — assign tenants, verify email, reset passwords, suspend
            accounts
          </p>
        </div>
        <Button className="rounded-xl gap-2" onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" />
          Add user
        </Button>
      </header>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total users", value: stats.total, tone: "from-sky-500/20 text-sky-950" },
            { label: "Verified", value: stats.verified, tone: "from-emerald-500/20 text-emerald-950" },
            { label: "Unverified", value: stats.unverified, tone: "from-amber-500/20 text-amber-950" },
            { label: "Suspended", value: stats.suspended, tone: "from-red-500/20 text-red-950" },
          ].map(({ label, value, tone }) => (
            <div
              key={label}
              className={cn(
                "rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-sm",
                tone,
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search email or name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={businessId}
          onChange={(e) => {
            setBusinessId(e.target.value);
            setPage(1);
          }}
          className="h-11 min-w-[160px] rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">All tenants</option>
          {tenantOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={suspended}
          onChange={(e) => {
            setSuspended(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">Any status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
        <select
          value={emailVerified}
          onChange={(e) => {
            setEmailVerified(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="all">Any email</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Loading users…
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No users match your filters
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/dashboard/platform/users/${u.id}`}
                        className="block font-medium hover:text-primary"
                      >
                        {u.name || "—"}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {u.email}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.role.toLowerCase().replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.business?.name ?? (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.suspended && (
                          <Badge className="bg-red-100 text-red-800">Suspended</Badge>
                        )}
                        {u.emailVerified ? (
                          <Badge className="bg-emerald-100 text-emerald-800 gap-0.5">
                            <MailCheck className="size-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-0.5">
                            <Mail className="size-3" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-primary/10 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages} · {data.total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Create user
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-input px-3 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tenant</Label>
                <select
                  value={form.businessId}
                  onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-input px-3 text-sm"
                >
                  <option value="">None</option>
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.emailVerified}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emailVerified: e.target.checked }))
                }
              />
              Mark email as verified
            </label>
            <Button
              className="w-full rounded-xl"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.email || !form.password}
            >
              Create user
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
