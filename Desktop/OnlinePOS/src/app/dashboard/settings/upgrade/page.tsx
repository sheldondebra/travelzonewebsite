"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettingsData } from "@/components/settings/settings-shell";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "₵0",
    features: ["100 products", "POS", "Basic reports"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "₵99/mo",
    features: ["Unlimited products", "SMS", "Marketplace"],
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "₵249/mo",
    features: ["Multi-user", "Payment gateway", "Priority support"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    features: ["Custom modules", "API access", "Dedicated support"],
  },
];

export default function UpgradeSettingsPage() {
  const queryClient = useQueryClient();
  const { data, refetch } = useSettingsData();
  const current = data?.business.subscriptionPlan ?? "FREE";

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPlan: plan }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Plan updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Upgrade</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your business growth
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "shadow-soft",
              current === plan.id && "border-primary ring-2 ring-primary/20",
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {current === plan.id && (
                  <Badge>Current</Badge>
                )}
              </div>
              <p className="text-2xl font-semibold">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={current === plan.id ? "outline" : "default"}
                disabled={current === plan.id || upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan.id)}
              >
                {current === plan.id ? "Active plan" : "Select plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
