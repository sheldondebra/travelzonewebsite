"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  Smartphone,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import {
  PlatformSmsOverviewCharts,
  PlatformSmsPeriodStrip,
  type PlatformSmsAnalytics,
} from "@/components/platform/platform-sms-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type PlatformSmsData = {
  stats: {
    totalSent: number;
    totalFailed: number;
    pendingSenderIds: number;
    activePackages: number;
    totalWalletBalance: number;
    totalRevenue: number;
    totalPending: number;
    totalPurchases: number;
  };
  provider: {
    id: string;
    provider: string;
    baseUrl: string;
    senderId: string | null;
    isActive: boolean;
  } | null;
  analytics: PlatformSmsAnalytics;
};

type SenderRow = {
  id: string;
  senderId: string;
  status: string;
  reason: string | null;
  createdAt: string;
  business: { name: string; slug: string };
};

type SmsPackageRow = {
  id: string;
  name: string;
  smsCount: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

type WalletRow = {
  businessId: string;
  name: string;
  slug: string;
  balance: number;
};

type PaymentConfig = {
  enabled: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  testMode: boolean;
};

type PurchaseRow = {
  id: string;
  smsCount: number;
  amount: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  business: { name: string };
  package: { name: string };
};

const MAIN_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "credits", label: "Credits & packages", icon: Package },
  { id: "clients", label: "Clients", icon: Users },
  { id: "setup", label: "Setup", icon: Settings2 },
] as const;

type MainTabId = (typeof MAIN_TABS)[number]["id"];

const CLIENT_SUB = [
  { id: "wallets", label: "Wallets" },
  { id: "sender-ids", label: "Sender IDs" },
] as const;

type ClientSubId = (typeof CLIENT_SUB)[number]["id"];

const SETUP_SUB = [
  { id: "provider", label: "SplitSMS provider" },
  { id: "payments", label: "Paystack" },
] as const;

type SetupSubId = (typeof SETUP_SUB)[number]["id"];

function TabBar<T extends string>({
  items,
  active,
  onChange,
  size = "main",
}: {
  items: readonly { id: T; label: string; icon?: LucideIcon }[];
  active: T;
  onChange: (id: T) => void;
  size?: "main" | "sub";
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-primary/10 bg-white p-1 shadow-sm",
        size === "sub" && "rounded-lg bg-muted/30 p-0.5",
      )}
    >
      {items.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg font-medium transition-colors touch-manipulation",
              size === "main" ? "px-4 py-2.5 text-sm" : "px-3 py-2 text-xs sm:text-sm",
              active === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-brand-rose/30",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex flex-col gap-2 border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/15 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function GeneralOfficeSms() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTabId>("overview");
  const [clientSub, setClientSub] = useState<ClientSubId>("wallets");
  const [setupSub, setSetupSub] = useState<SetupSubId>("provider");

  const [providerForm, setProviderForm] = useState({
    baseUrl: "https://api.splitsms.com/v1/send",
    apiKey: "",
    senderId: "TECUNIT",
  });
  const [paymentForm, setPaymentForm] = useState({
    enabled: false,
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    testMode: true,
  });
  const [newPackage, setNewPackage] = useState({
    name: "",
    smsCount: 100,
    price: 25,
    currency: "GHS",
  });
  const [walletAdjust, setWalletAdjust] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["platform-sms"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms");
      return parseApiResponse<PlatformSmsData>(res);
    },
  });

  const { data: senderRows = [] } = useQuery({
    queryKey: ["platform-sms-sender-ids"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms/sender-ids");
      return parseApiResponse<SenderRow[]>(res);
    },
    enabled: mainTab === "clients" && clientSub === "sender-ids",
  });

  const { data: packageRows = [] } = useQuery({
    queryKey: ["platform-sms-packages"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms/packages");
      return parseApiResponse<SmsPackageRow[]>(res);
    },
    enabled: mainTab === "credits",
  });

  const { data: walletRows = [] } = useQuery({
    queryKey: ["platform-sms-wallets"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms/wallets");
      return parseApiResponse<WalletRow[]>(res);
    },
    enabled: mainTab === "clients" && clientSub === "wallets",
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["platform-sms-purchases"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms/purchases");
      return parseApiResponse<PurchaseRow[]>(res);
    },
    enabled: mainTab === "credits",
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["platform-sms-payments"],
    queryFn: async () => {
      const res = await fetch("/api/platform/sms/payments");
      return parseApiResponse<PaymentConfig>(res);
    },
    enabled: mainTab === "setup" && setupSub === "payments",
  });

  useEffect(() => {
    if (data?.provider) {
      setProviderForm((f) => ({
        ...f,
        baseUrl: data.provider!.baseUrl,
        senderId: data.provider!.senderId ?? "TECUNIT",
      }));
    }
  }, [data?.provider]);

  useEffect(() => {
    if (paymentConfig) {
      setPaymentForm((f) => ({
        ...f,
        enabled: paymentConfig.enabled,
        publicKey: paymentConfig.publicKey || f.publicKey,
        testMode: paymentConfig.testMode,
      }));
    }
  }, [paymentConfig]);

  const saveProvider = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/sms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "SPLITSMS", ...providerForm, isActive: true }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("SplitSMS provider saved");
      queryClient.invalidateQueries({ queryKey: ["platform-sms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Default SMS packages & templates seeded");
      queryClient.invalidateQueries({ queryKey: ["platform-sms-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-sms"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: "APPROVED" | "DENIED";
      reason?: string;
    }) => {
      const res = await fetch("/api/platform/sms/sender-ids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-sms-sender-ids"] });
      queryClient.invalidateQueries({ queryKey: ["platform-sms"] });
    },
  });

  const savePayments = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/sms/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Paystack settings saved");
      queryClient.invalidateQueries({ queryKey: ["platform-sms-payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPackage = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/sms/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPackage),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Package created");
      setNewPackage({ name: "", smsCount: 100, price: 25, currency: "GHS" });
      queryClient.invalidateQueries({ queryKey: ["platform-sms-packages"] });
      queryClient.invalidateQueries({ queryKey: ["platform-sms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePackage = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch("/api/platform/sms/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-sms-packages"] });
    },
  });

  const adjustWallet = useMutation({
    mutationFn: async ({
      businessId,
      amount,
    }: {
      businessId: string;
      amount: number;
    }) => {
      const res = await fetch("/api/platform/sms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, amount }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Wallet updated");
      queryClient.invalidateQueries({ queryKey: ["platform-sms-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["platform-sms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = data?.stats;
  const analytics = data?.analytics;
  const providerActive = data?.provider?.isActive;

  return (
    <PageShell size="wide" className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-primary/20 text-primary">
              <Smartphone className="size-6" strokeWidth={1.75} />
            </span>
            SMS control
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Platform SMS revenue, tenant credits, delivery analytics, and provider
            configuration
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            className={cn(
              "rounded-full px-3 py-1",
              providerActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-900",
            )}
          >
            <Zap className="mr-1 inline size-3" />
            {providerActive ? "Provider active" : "Provider not set"}
          </Badge>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            <RefreshCw className={cn("size-4", seedMutation.isPending && "animate-spin")} />
            Seed defaults
          </Button>
        </div>
      </header>

      {!isLoading && stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Sent",
              value: stats.totalSent,
              icon: MessageSquare,
              tone: "from-emerald-500/25 to-emerald-500/5 text-emerald-950",
            },
            {
              label: "Failed",
              value: stats.totalFailed,
              icon: X,
              tone: "from-red-500/25 to-red-500/5 text-red-950",
            },
            {
              label: "Credits in wallets",
              value: stats.totalWalletBalance,
              icon: Wallet,
              tone: "from-violet-500/25 to-violet-500/5 text-violet-950",
            },
            {
              label: "Revenue",
              value: `GHS ${stats.totalRevenue.toLocaleString()}`,
              icon: CreditCard,
              tone: "from-sky-500/25 to-sky-500/5 text-sky-950",
            },
            {
              label: "Pending IDs",
              value: stats.pendingSenderIds,
              icon: Shield,
              tone: "from-amber-500/25 to-amber-500/5 text-amber-950",
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className={cn(
                "rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-sm",
                tone,
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {label}
                </span>
                <Icon className="size-4 opacity-70" />
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      )}

      <TabBar items={MAIN_TABS} active={mainTab} onChange={setMainTab} />

      {mainTab === "overview" && analytics && (
        <div className="space-y-4">
          <PlatformSmsPeriodStrip summary={analytics.summary} />
          <PlatformSmsOverviewCharts analytics={analytics} />
        </div>
      )}

      {mainTab === "overview" && isLoading && (
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      )}

      {mainTab === "credits" && (
        <div className="space-y-4">
          <Panel title="SMS packages" description="Credit bundles tenants can purchase">
            <div className="divide-y divide-primary/10">
              {packageRows.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  No packages yet. Use Seed defaults or add one below.
                </p>
              ) : (
                packageRows.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-800">
                        <Package className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pkg.smsCount.toLocaleString()} units · {pkg.currency}{" "}
                          {pkg.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={pkg.isActive ? "outline" : "default"}
                      className="rounded-xl"
                      onClick={() =>
                        togglePackage.mutate({ id: pkg.id, isActive: !pkg.isActive })
                      }
                    >
                      {pkg.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-primary/10 bg-muted/20 p-4 sm:p-5">
              <p className="mb-3 text-sm font-medium">Add package</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input
                  placeholder="Name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="SMS count"
                  value={newPackage.smsCount}
                  onChange={(e) =>
                    setNewPackage((p) => ({ ...p, smsCount: Number(e.target.value) }))
                  }
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={newPackage.price}
                  onChange={(e) =>
                    setNewPackage((p) => ({ ...p, price: Number(e.target.value) }))
                  }
                  className="rounded-xl"
                />
                <Button
                  className="rounded-xl gap-1"
                  onClick={() => createPackage.mutate()}
                  disabled={!newPackage.name || createPackage.isPending}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="Recent purchases" description="Paid SMS credit orders">
            <div className="divide-y divide-primary/10">
              {purchases.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">No purchases yet.</p>
              ) : (
                purchases.slice(0, 20).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <div>
                      <p className="font-medium">{p.business.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.package.name} · {p.smsCount} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {p.currency} {p.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {p.paymentStatus.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      )}

      {mainTab === "clients" && (
        <div className="space-y-4">
          <TabBar
            items={CLIENT_SUB}
            active={clientSub}
            onChange={setClientSub}
            size="sub"
          />

          {clientSub === "wallets" && (
            <Panel title="Client wallets" description="Credit balances per tenant">
              <div className="divide-y divide-primary/10">
                {walletRows.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No clients yet.</p>
                ) : (
                  walletRows.map((row) => (
                    <div
                      key={row.businessId}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-800">
                          <Wallet className="size-5" />
                        </span>
                        <div>
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-bold tabular-nums text-foreground">
                              {row.balance.toLocaleString()}
                            </span>{" "}
                            units
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="± units"
                          value={walletAdjust[row.businessId] ?? ""}
                          onChange={(e) =>
                            setWalletAdjust((m) => ({
                              ...m,
                              [row.businessId]: e.target.value,
                            }))
                          }
                          className="h-9 w-28 rounded-xl"
                        />
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            const amount = Number(walletAdjust[row.businessId]);
                            if (!amount) return;
                            adjustWallet.mutate({ businessId: row.businessId, amount });
                          }}
                        >
                          Adjust
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          )}

          {clientSub === "sender-ids" && (
            <Panel title="Sender ID approvals" description="Tenant-branded SMS sender names">
              <div className="divide-y divide-primary/10">
                {senderRows.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  senderRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div>
                        <p className="font-semibold">{row.business.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-mono font-medium">{row.senderId}</span>
                        </p>
                        <Badge className="mt-1 capitalize">{row.status.toLowerCase()}</Badge>
                      </div>
                      {row.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="rounded-xl gap-1"
                            onClick={() =>
                              reviewMutation.mutate({ id: row.id, status: "APPROVED" })
                            }
                          >
                            <Check className="size-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1"
                            onClick={() =>
                              reviewMutation.mutate({
                                id: row.id,
                                status: "DENIED",
                                reason: "Does not meet platform guidelines",
                              })
                            }
                          >
                            <X className="size-4" />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Panel>
          )}
        </div>
      )}

      {mainTab === "setup" && (
        <div className="space-y-4">
          <TabBar items={SETUP_SUB} active={setupSub} onChange={setSetupSub} size="sub" />

          {setupSub === "provider" && (
            <Panel
              title="SplitSMS provider"
              description="Platform gateway — fallback Sender ID when clients have none approved"
            >
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Base URL</Label>
                  <Input
                    value={providerForm.baseUrl}
                    onChange={(e) =>
                      setProviderForm((f) => ({ ...f, baseUrl: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API key</Label>
                  <Input
                    type="password"
                    value={providerForm.apiKey}
                    onChange={(e) =>
                      setProviderForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                    className="rounded-xl"
                    placeholder={data?.provider ? "••••••••" : "SplitSMS API key"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fallback Sender ID</Label>
                  <Input
                    value={providerForm.senderId}
                    onChange={(e) =>
                      setProviderForm((f) => ({
                        ...f,
                        senderId: e.target.value.toUpperCase(),
                      }))
                    }
                    className="rounded-xl uppercase"
                  />
                </div>
                <Button
                  className="rounded-xl sm:col-span-2"
                  onClick={() => saveProvider.mutate()}
                  disabled={saveProvider.isPending}
                >
                  Save provider
                </Button>
              </div>
            </Panel>
          )}

          {setupSub === "payments" && (
            <Panel
              title="Paystack"
              description={
                <>
                  Tenant SMS purchases · Webhook{" "}
                  <code className="rounded bg-muted px-1 text-xs">
                    /api/webhooks/sms-payment
                  </code>
                </>
              }
            >
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paymentForm.enabled}
                      onChange={(e) =>
                        setPaymentForm((f) => ({ ...f, enabled: e.target.checked }))
                      }
                    />
                    Enable Paystack for SMS package purchases
                  </label>
                </div>
                <div className="space-y-2">
                  <Label>Public key</Label>
                  <Input
                    value={paymentForm.publicKey}
                    onChange={(e) =>
                      setPaymentForm((f) => ({ ...f, publicKey: e.target.value }))
                    }
                    className="rounded-xl"
                    placeholder="pk_test_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret key</Label>
                  <Input
                    type="password"
                    value={paymentForm.secretKey}
                    onChange={(e) =>
                      setPaymentForm((f) => ({ ...f, secretKey: e.target.value }))
                    }
                    className="rounded-xl"
                    placeholder={paymentConfig?.secretKey ? "••••••••" : "sk_test_..."}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Webhook secret (optional)</Label>
                  <Input
                    type="password"
                    value={paymentForm.webhookSecret}
                    onChange={(e) =>
                      setPaymentForm((f) => ({ ...f, webhookSecret: e.target.value }))
                    }
                    className="rounded-xl"
                  />
                </div>
                <Button
                  className="rounded-xl sm:col-span-2"
                  onClick={() => savePayments.mutate()}
                  disabled={savePayments.isPending}
                >
                  Save Paystack settings
                </Button>
              </div>
            </Panel>
          )}
        </div>
      )}
    </PageShell>
  );
}
