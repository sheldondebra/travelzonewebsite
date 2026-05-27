"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";
import {
  mergeSettings,
  type BusinessSettings,
} from "@/lib/settings/defaults";

type SettingsResponse = {
  business: {
    name: string;
    subscriptionPlan: string;
    taxRate: number;
    themeColor?: string | null;
    currency?: string;
    receiptFooter?: string | null;
  };
  settings: BusinessSettings;
};

export function useSettingsData() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return parseApiResponse<SettingsResponse>(res);
    },
  });
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted/60" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
    </div>
  );
}

export function SettingsPageShell({
  title,
  description,
  section,
  children,
}: {
  title: string;
  description: string;
  section: keyof BusinessSettings;
  children: (
    settings: BusinessSettings,
    update: (patch: Partial<BusinessSettings[typeof section]>) => void,
  ) => React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useSettingsData();
  const [local, setLocal] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    if (data?.settings) {
      setLocal(
        mergeSettings(data.settings, {
          themeColor: data.business.themeColor,
          currency: data.business.currency,
          receiptFooter: data.business.receiptFooter,
        }),
      );
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!local) return;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { [section]: local[section] },
          ...(section === "appearance"
            ? { themeColor: local.appearance.primaryColor }
            : {}),
          ...(section === "currency" ? { currency: local.currency.code } : {}),
          ...(section === "posReceipt"
            ? { receiptFooter: local.posReceipt.thankYouMessage }
            : {}),
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !local) {
    return <SettingsSkeleton />;
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-soft">
        <CardHeader>
          <CardTitle className="text-destructive">Could not load settings</CardTitle>
          <CardDescription>Try refreshing the page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const update = (patch: Partial<BusinessSettings[typeof section]>) => {
    setLocal((s) =>
      s ? { ...s, [section]: { ...s[section], ...patch } } : s,
    );
  };

  return (
    <PageShell size="full">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="touch-manipulation"
          >
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        }
      />
      <Card className="border-gray-100 shadow-soft">
        <CardHeader className="border-b border-gray-50 pb-4 lg:hidden">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 lg:pt-4">{children(local, update)}</CardContent>
      </Card>
    </PageShell>
  );
}
