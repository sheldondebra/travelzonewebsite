"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsData } from "@/components/settings/settings-shell";
import { settingsSections } from "@/lib/settings/sections";

export default function SettingsOverviewPage() {
  const { data, isLoading } = useSettingsData();

  return (
    <PageShell size="full">
      <PageHeader
        title="System settings"
        description={
          isLoading
            ? "Loading your configuration…"
            : `Configure appearance, payments, POS, messaging, and more for ${data?.business.name ?? "your business"}.`
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="h-full border-gray-100 shadow-soft transition hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-rose/60">
                  <Icon className="size-5 text-primary" strokeWidth={1.5} />
                </span>
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {data && (
        <Card className="border-primary/20 bg-gradient-to-br from-brand-cream/80 to-brand-rose/30 shadow-soft">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div>
              <p className="font-medium">Current plan</p>
              <p className="text-sm capitalize text-muted-foreground">
                {data.business.subscriptionPlan.toLowerCase()} · Tax {data.business.taxRate}%
              </p>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="text-sm font-medium text-primary underline"
            >
              Manage billing
            </Link>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
