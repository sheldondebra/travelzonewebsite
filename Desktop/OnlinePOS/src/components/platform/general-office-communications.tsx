"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { PlatformOfficeConfig } from "@/lib/platform/notification-config";
import { DEFAULT_PLATFORM_OFFICE } from "@/lib/platform/notification-config";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

type CommsData = {
  office: { id: string; name: string; slug: string };
  config: PlatformOfficeConfig;
  status: {
    configured: boolean;
    smsReady: boolean;
    mailReady: boolean;
    inheritToAllTenants: boolean;
  };
};

type LogRow = {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  status: string;
  message: string | null;
  source: string | null;
  orderId: string | null;
  createdAt: string;
  business: { name: string; slug: string } | null;
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
  { id: "test", label: "Test" },
  { id: "logs", label: "Logs" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function GeneralOfficeCommunications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("overview");
  const [local, setLocal] = useState<PlatformOfficeConfig>(DEFAULT_PLATFORM_OFFICE);
  const [testPhone, setTestPhone] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["platform-communications"],
    queryFn: async () => {
      const res = await fetch("/api/platform/communications");
      return parseApiResponse<CommsData>(res);
    },
  });

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ["platform-notification-logs"],
    queryFn: async () => {
      const res = await fetch("/api/platform/communications/logs?limit=80");
      return parseApiResponse<{ logs: LogRow[] }>(res);
    },
    enabled: tab === "logs",
  });

  const logsPagination = useClientPagination(logsData?.logs ?? [], undefined, [tab]);

  useEffect(() => {
    if (data?.config) setLocal(data.config);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/communications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...local, propagate: true }),
      });
      return parseApiResponse<{ propagation: { updated: number } }>(res);
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["platform-communications"] });
      toast.success(
        `Saved. Applied to ${r.propagation?.updated ?? 0} tenant store(s).`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMutation = useMutation({
    mutationFn: async (channel: "sms" | "email" | "both") => {
      const res = await fetch("/api/platform/communications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          phone: testPhone || undefined,
          email: testEmail || undefined,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Test sent — check phone/inbox and Logs tab");
      refetchLogs();
      setTab("logs");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function patch(p: Partial<PlatformOfficeConfig>) {
    setLocal((prev) => ({ ...prev, ...p }));
  }

  function patchSms(p: Partial<PlatformOfficeConfig["sms"]>) {
    setLocal((prev) => ({ ...prev, sms: { ...prev.sms, ...p } }));
  }

  function patchMail(p: Partial<PlatformOfficeConfig["mail"]>) {
    setLocal((prev) => ({ ...prev, mail: { ...prev.mail, ...p } }));
  }

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading General Office…</p>;
  }

  const status = data.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Shield className="size-8 text-primary" />
            General Office
          </h1>
          <p className="text-muted-foreground">
            Central SMS, email & receipt delivery for all tenants — credentials are
            masked in the UI
          </p>
          <p className="text-xs text-muted-foreground">
            Office: {data.office.name} ({data.office.slug})
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save & apply to tenants"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          label="SMS"
          ready={status.smsReady}
          icon={MessageSquare}
        />
        <StatusCard label="Email" ready={status.mailReady} icon={Mail} />
        <StatusCard
          label="Tenant inherit"
          ready={status.inheritToAllTenants}
          icon={RefreshCw}
          readyLabel="On"
          notReadyLabel="Off"
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border bg-white p-1 shadow-soft">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-brand-rose/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant-wide defaults</CardTitle>
            <CardDescription>
              When enabled, every store uses General Office credentials for POS
              receipts (Novasori included)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Inherit to all tenants"
              checked={local.inheritToAllTenants}
              onChange={(v) => patch({ inheritToAllTenants: v })}
            />
            <ToggleRow
              label="Auto-enable SMS on tenant settings"
              checked={local.autoEnableTenantSms}
              onChange={(v) => patch({ autoEnableTenantSms: v })}
            />
            <ToggleRow
              label="Auto-enable email on tenant settings"
              checked={local.autoEnableTenantEmail}
              onChange={(v) => patch({ autoEnableTenantEmail: v })}
            />
            <ToggleRow
              label="Auto-send POS receipt SMS & email after sale"
              checked={local.autoEnablePosReceiptDelivery}
              onChange={(v) => patch({ autoEnablePosReceiptDelivery: v })}
            />
          </CardContent>
        </Card>
      )}

      {tab === "sms" && (
        <Card>
          <CardHeader>
            <CardTitle>SMS (Hubtel / Africa&apos;s Talking)</CardTitle>
            <CardDescription>
              Secrets show as ••••••••last4 — leave masked to keep existing value
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ToggleRow
              label="Enable SMS"
              checked={local.sms.enabled}
              onChange={(v) => patchSms({ enabled: v })}
            />
            <div className="space-y-2">
              <Label>Provider</Label>
              <select
                className="flex h-10 w-full rounded-md border px-3 text-sm"
                value={local.sms.provider}
                onChange={(e) => patchSms({ provider: e.target.value })}
              >
                <option value="hubtel">Hubtel</option>
                <option value="africas_talking">Africa&apos;s Talking</option>
              </select>
            </div>
            <Field
              label="Hubtel Client ID (masked)"
              value={local.sms.hubtelClientId}
              onChange={(v) => patchSms({ hubtelClientId: v })}
              placeholder="•••••••• or new value"
            />
            <Field
              label="Hubtel Client Secret (masked)"
              value={local.sms.hubtelClientSecret}
              onChange={(v) => patchSms({ hubtelClientSecret: v })}
              type="password"
            />
            <Field
              label="API key (optional)"
              value={local.sms.apiKey}
              onChange={(v) => patchSms({ apiKey: v })}
            />
            <Field
              label="Sender ID"
              value={local.sms.senderId}
              onChange={(v) => patchSms({ senderId: v })}
            />
          </CardContent>
        </Card>
      )}

      {tab === "email" && (
        <Card>
          <CardHeader>
            <CardTitle>Email (Resend or SMTP)</CardTitle>
            <CardDescription>
              Resend API key is preferred; SMTP fields are optional fallback
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ToggleRow
              label="Enable email"
              checked={local.mail.enabled}
              onChange={(v) => patchMail({ enabled: v })}
            />
            <Field
              label="From name"
              value={local.mail.fromName}
              onChange={(v) => patchMail({ fromName: v })}
            />
            <Field
              label="From email"
              value={local.mail.fromEmail}
              onChange={(v) => patchMail({ fromEmail: v })}
            />
            <Field
              label="Resend API key (masked)"
              value={local.mail.resendApiKey}
              onChange={(v) => patchMail({ resendApiKey: v })}
              type="password"
            />
            <Field
              label="SMTP host"
              value={local.mail.smtpHost}
              onChange={(v) => patchMail({ smtpHost: v })}
            />
            <Field
              label="SMTP port"
              value={String(local.mail.smtpPort)}
              onChange={(v) => patchMail({ smtpPort: Number(v) || 587 })}
            />
            <Field
              label="SMTP user (masked)"
              value={local.mail.smtpUser}
              onChange={(v) => patchMail({ smtpUser: v })}
            />
            <Field
              label="SMTP password (masked)"
              value={local.mail.smtpPass}
              onChange={(v) => patchMail({ smtpPass: v })}
              type="password"
            />
          </CardContent>
        </Card>
      )}

      {tab === "test" && (
        <Card>
          <CardHeader>
            <CardTitle>Send test</CardTitle>
            <CardDescription>
              Uses saved credentials (save first if you changed values)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Test phone (SMS)"
              value={testPhone}
              onChange={setTestPhone}
              placeholder="233XXXXXXXXX"
            />
            <Field
              label="Test email"
              value={testEmail}
              onChange={setTestEmail}
              placeholder="you@example.com"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={testMutation.isPending}
                onClick={() => testMutation.mutate("sms")}
              >
                <MessageSquare className="mr-2 size-4" />
                Test SMS
              </Button>
              <Button
                variant="outline"
                disabled={testMutation.isPending}
                onClick={() => testMutation.mutate("email")}
              >
                <Mail className="mr-2 size-4" />
                Test email
              </Button>
              <Button
                disabled={testMutation.isPending}
                onClick={() => testMutation.mutate("both")}
              >
                <Send className="mr-2 size-4" />
                Test both
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "logs" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Delivery logs</CardTitle>
              <CardDescription>All SMS/email attempts platform-wide</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsPagination.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.channel}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs">
                      {log.recipient}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.business?.name ?? "Platform"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          log.status === "sent" && "bg-green-100 text-green-800",
                          log.status === "failed" && "bg-red-100 text-red-800",
                        )}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {log.message ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {logsPagination.total > 0 && (
              <TablePagination
                page={logsPagination.page}
                pageSize={logsPagination.pageSize}
                total={logsPagination.total}
                onPageChange={logsPagination.setPage}
                itemName="logs"
              />
            )}
            {!logsData?.logs?.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No logs yet. Run a test or complete a POS sale.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusCard({
  label,
  ready,
  icon: Icon,
  readyLabel = "Ready",
  notReadyLabel = "Not configured",
}: {
  label: string;
  ready: boolean;
  icon: React.ComponentType<{ className?: string }>;
  readyLabel?: string;
  notReadyLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <Icon className="size-5 text-primary" />
        <div>
          <p className="font-medium">{label}</p>
          <p
            className={cn(
              "flex items-center gap-1 text-sm",
              ready ? "text-green-700" : "text-amber-700",
            )}
          >
            {ready ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <XCircle className="size-4" />
            )}
            {ready ? readyLabel : notReadyLabel}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
