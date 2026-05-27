"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  History,
  KeyRound,
  MailCheck,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

type UserDetail = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  businessId: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  passwordChangedAt: string;
  createdAt: string;
  updatedAt: string;
  business: { id: string; name: string; slug: string } | null;
  _count: { activities: number; ordersAsCashier: number };
};

type ActivityRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  business: { name: string; slug: string };
};

type Tenant = { id: string; name: string; slug: string };

const ROLES = ["OWNER", "MANAGER", "STAFF", "DELIVERY", "CUSTOMER", "PLATFORM_ADMIN"] as const;

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "activity", label: "Activity log", icon: History },
  { id: "security", label: "Security", icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PlatformUserDetail({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("profile");
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [edit, setEdit] = useState({
    name: "",
    email: "",
    role: "STAFF",
    businessId: "",
    emailVerified: false,
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["platform-user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}`);
      const data = await parseApiResponse<UserDetail>(res);
      setEdit({
        name: data.name ?? "",
        email: data.email,
        role: data.role,
        businessId: data.businessId ?? "",
        emailVerified: data.emailVerified,
      });
      return data;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["platform-user-activity", userId],
    enabled: tab === "activity",
    queryFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}/activity`);
      return parseApiResponse<ActivityRow[]>(res);
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: async () => {
      const res = await fetch("/api/platform/tenants");
      return parseApiResponse<Tenant[]>(res);
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-user", userId] });
    queryClient.invalidateQueries({ queryKey: ["platform-users"] });
    queryClient.invalidateQueries({ queryKey: ["platform-users-stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edit.name || null,
          email: edit.email,
          role: edit.role,
          businessId: edit.businessId || null,
          emailVerified: edit.emailVerified,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("User saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}/verify-email`, {
        method: "POST",
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Email verified");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMutation = useMutation({
    mutationFn: async (suspended: boolean) => {
      const res = await fetch(`/api/platform/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended, reason: suspendReason || undefined }),
      });
      return parseApiResponse(res);
    },
    onSuccess: (_, suspended) => {
      toast.success(suspended ? "User suspended" : "User reactivated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Password reset");
      setResetOpen(false);
      setNewPassword("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/platform/users/${userId}`, { method: "DELETE" });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("User deleted");
      window.location.href = "/dashboard/platform/users";
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tenantOptions = tenants.filter((t) => t.slug !== "tecunit-general-office");

  if (isLoading) {
    return (
      <PageShell size="wide">
        <p className="text-sm text-muted-foreground">Loading user…</p>
      </PageShell>
    );
  }

  if (error || !user) {
    return (
      <PageShell size="wide">
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "User not found"}
        </p>
        <Link href="/dashboard/platform/users" className={cn(buttonVariants({ variant: "outline" }), "mt-4 rounded-xl")}>
          Back to users
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/platform/users"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            All users
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{user.name || user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {user.role.toLowerCase().replace("_", " ")}
            </Badge>
            {user.suspended && (
              <Badge className="bg-red-100 text-red-800">Suspended</Badge>
            )}
            {user.emailVerified ? (
              <Badge className="bg-emerald-100 text-emerald-800">Email verified</Badge>
            ) : (
              <Badge variant="outline">Email unverified</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!user.emailVerified && (
            <Button
              variant="outline"
              className="rounded-xl gap-1"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
            >
              <MailCheck className="size-4" />
              Verify email
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-xl gap-1"
            onClick={() =>
              user.suspended
                ? suspendMutation.mutate(false)
                : suspendMutation.mutate(true)
            }
          >
            <ShieldAlert className="size-4" />
            {user.suspended ? "Reactivate" : "Suspend"}
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl gap-1"
            onClick={() => {
              if (confirm(`Delete ${user.email}? This cannot be undone.`)) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-violet-500/15 to-white p-4">
          <Building2 className="size-5 text-violet-700" />
          <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Tenant</p>
          <p className="font-semibold">{user.business?.name ?? "Unassigned"}</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-sky-500/15 to-white p-4">
          <History className="size-5 text-sky-700" />
          <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Activity</p>
          <p className="font-semibold tabular-nums">{user._count.activities} events</p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-emerald-500/15 to-white p-4">
          <User className="size-5 text-emerald-700" />
          <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">POS orders</p>
          <p className="font-semibold tabular-nums">{user._count.ordersAsCashier}</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-primary/10 bg-white p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-brand-rose/30",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <section className="rounded-2xl border border-primary/10 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold">Profile & assignment</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={edit.name}
                onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={edit.email}
                onChange={(e) => setEdit((x) => ({ ...x, email: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={edit.role}
                onChange={(e) => setEdit((x) => ({ ...x, role: e.target.value }))}
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
              <Label>Assign to tenant</Label>
              <select
                value={edit.businessId}
                onChange={(e) => setEdit((x) => ({ ...x, businessId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-input px-3 text-sm"
              >
                <option value="">No tenant</option>
                {tenantOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={edit.emailVerified}
              onChange={(e) =>
                setEdit((x) => ({ ...x, emailVerified: e.target.checked }))
              }
            />
            Email verified
          </label>
          <p className="mt-4 text-xs text-muted-foreground">
            Joined {format(new Date(user.createdAt), "PPpp")} · Password changed{" "}
            {format(new Date(user.passwordChangedAt), "PP")}
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save changes
          </Button>
        </section>
      )}

      {tab === "activity" && (
        <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
          <div className="border-b border-primary/10 px-5 py-4">
            <h2 className="font-semibold">Activity log</h2>
            <p className="text-sm text-muted-foreground">
              Actions recorded for this user across tenants
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No activity logged yet
                  </TableCell>
                </TableRow>
              ) : (
                activity.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="capitalize">{log.action}</TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-sm">{log.business.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {log.details ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      )}

      {tab === "security" && (
        <section className="space-y-4 rounded-2xl border border-primary/10 bg-white p-5 shadow-card">
          <h2 className="font-semibold">Security</h2>
          <div className="rounded-xl border border-primary/10 bg-muted/20 p-4">
            <p className="text-sm font-medium">Reset password</p>
            <p className="text-sm text-muted-foreground">
              Set a new password for this user. They will need to use it on next login.
            </p>
            <Button
              className="mt-3 rounded-xl gap-1"
              variant="outline"
              onClick={() => setResetOpen(true)}
            >
              <KeyRound className="size-4" />
              Reset password
            </Button>
          </div>
          {!user.suspended && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
              <p className="text-sm font-medium text-amber-950">Suspend account</p>
              <Input
                placeholder="Reason (optional)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-2 rounded-xl"
              />
              <Button
                variant="outline"
                className="mt-3 rounded-xl border-red-200 text-red-800 hover:bg-red-50"
                onClick={() => suspendMutation.mutate(true)}
              >
                Suspend user
              </Button>
            </div>
          )}
          {user.suspended && user.suspendedReason && (
            <p className="text-sm text-muted-foreground">
              Suspension reason: {user.suspendedReason}
              {user.suspendedAt &&
                ` · ${format(new Date(user.suspendedAt), "PP")}`}
            </p>
          )}
        </section>
      )}

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || newPassword.length < 8}
            >
              Update password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
