"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  MessageSquare,
  Package,
  Send,
  Shield,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type SmsOverview = {
  balance: number;
  lowBalance: boolean;
  senderId: {
    id: string;
    senderId: string;
    status: string;
    reason: string | null;
  } | null;
  automations: { key: string; label: string; enabled: boolean }[];
};

type SmsPackage = {
  id: string;
  name: string;
  smsCount: number;
  price: number;
  currency: string;
};

function SenderBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "DENIED"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-900";
  return (
    <Badge className={cn("rounded-full capitalize", tone)}>{status.toLowerCase()}</Badge>
  );
}

type PurchaseResult = {
  mode: "instant" | "paystack";
  credited?: number;
  authorizationUrl?: string;
  reference?: string;
};

export function SmsHub() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [senderInput, setSenderInput] = useState("");

  const { data: overview } = useQuery({
    queryKey: ["sms-overview"],
    queryFn: async () => {
      const res = await fetch("/api/sms/overview");
      return parseApiResponse<SmsOverview>(res);
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["sms-packages"],
    queryFn: async () => {
      const res = await fetch("/api/sms/packages");
      return parseApiResponse<SmsPackage[]>(res);
    },
  });

  const senderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sms/sender-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: senderInput }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Sender ID submitted for approval");
      setSenderInput("");
      queryClient.invalidateQueries({ queryKey: ["sms-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const automationMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const res = await fetch("/api/sms/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sms-overview"] }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await fetch("/api/sms/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      return parseApiResponse<PurchaseResult>(res);
    },
    onSuccess: (data) => {
      if (data.mode === "paystack" && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      toast.success(`Added ${data.credited ?? 0} SMS credits`);
      queryClient.invalidateQueries({ queryKey: ["sms-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    const payment = searchParams.get("payment");
    const reference = searchParams.get("reference");
    if (payment !== "success" || !reference) return;

    void (async () => {
      try {
        const res = await fetch(
          `/api/sms/purchase/verify?reference=${encodeURIComponent(reference)}`,
        );
        const data = await parseApiResponse<{ credited?: number; alreadyPaid?: boolean }>(
          res,
        );
        toast.success(
          data.alreadyPaid
            ? "Payment already applied to your wallet"
            : `Added ${data.credited ?? 0} SMS credits`,
        );
        queryClient.invalidateQueries({ queryKey: ["sms-overview"] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Payment verification failed");
      } finally {
        router.replace("/dashboard/settings/sms");
      }
    })();
  }, [queryClient, router, searchParams]);

  return (
    <div className="space-y-5">
      {overview?.lowBalance && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Your SMS balance is low ({overview.balance} units). Buy a package to keep
            sending receipts and delivery updates.
          </p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-900/80">
              SMS balance
            </span>
            <Wallet className="size-4 text-violet-700" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-violet-950">
            {overview?.balance ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-sky-500/20 to-sky-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">
              Sender ID
            </span>
            <Shield className="size-4 text-sky-700" />
          </div>
          <p className="mt-2 truncate text-lg font-bold text-sky-950">
            {overview?.senderId?.senderId ?? "Not set"}
          </p>
          {overview?.senderId && (
            <SenderBadge status={overview.senderId.status} />
          )}
        </div>
        <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">
              Automations
            </span>
            <MessageSquare className="size-4 text-emerald-700" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">
            {overview?.automations.filter((a) => a.enabled).length ?? 0}
            <span className="text-base font-medium text-emerald-800/70">
              /{overview?.automations.length ?? 0}
            </span>
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div className="border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/20 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">Request Sender ID</h2>
          <p className="text-sm text-muted-foreground">
            Alphanumeric, 3–11 characters. General Office must approve before use.
          </p>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
          <div className="flex-1 space-y-2">
            <Label htmlFor="senderId">Sender ID</Label>
            <Input
              id="senderId"
              value={senderInput}
              onChange={(e) => setSenderInput(e.target.value.toUpperCase())}
              placeholder="NOVASORI"
              maxLength={11}
              className="h-11 rounded-xl uppercase"
            />
          </div>
          <Button
            type="button"
            className="h-11 rounded-xl gap-2"
            disabled={senderInput.length < 3 || senderMutation.isPending}
            onClick={() => senderMutation.mutate()}
          >
            <Send className="size-4" />
            Submit
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div className="border-b border-primary/10 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">Buy SMS packages</h2>
          <p className="text-sm text-muted-foreground">
            Credits are deducted per message (160 chars = 1 unit). Pay with Mobile Money
            or card via Paystack.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => purchaseMutation.mutate(pkg.id)}
              disabled={purchaseMutation.isPending}
              className="rounded-2xl border border-primary/15 bg-gradient-to-br from-white to-brand-cream/30 p-4 text-left transition-all hover:border-primary/30 hover:shadow-md touch-manipulation"
            >
              <Package className="size-5 text-primary" />
              <p className="mt-2 font-semibold">{pkg.name}</p>
              <p className="text-2xl font-bold tabular-nums">{pkg.smsCount}</p>
              <p className="text-xs text-muted-foreground">SMS units</p>
              <p className="mt-2 text-sm font-semibold text-primary">
                {pkg.currency} {pkg.price.toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
        <div className="border-b border-primary/10 px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">SMS automations</h2>
        </div>
        <ul className="divide-y divide-primary/10">
          {overview?.automations.map((a) => (
            <li
              key={a.key}
              className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
            >
              <span className="text-sm font-medium">{a.label}</span>
              <Toggle
                label=""
                checked={a.enabled}
                onChange={(enabled) =>
                  automationMutation.mutate({ key: a.key, enabled })
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/settings/sms-templates"
          className={buttonVariants({ variant: "outline", className: "rounded-xl" })}
        >
          Edit templates
        </Link>
        <Link
          href="/dashboard/settings/sms/logs"
          className={buttonVariants({ variant: "outline", className: "rounded-xl" })}
        >
          View SMS logs
        </Link>
      </div>
    </div>
  );
}

export function SmsSettingsWithHub() {
  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader
        title="SMS"
        description="Manage your SMS balance, Sender ID, automations, and message templates"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading SMS…</p>}>
        <SmsHub />
      </Suspense>
    </PageShell>
  );
}
