"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  taxRate: number;
  lowStockThreshold: number;
};

export default function BusinessProfileSettingsPage() {
  const queryClient = useQueryClient();
  const { data: business, isLoading } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      return parseApiResponse<Business>(res);
    },
  });

  const [form, setForm] = useState<Partial<Business>>({});

  useEffect(() => {
    if (business) setForm(business);
  }, [business]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      return parseApiResponse<Business>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Business profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Business profile</h1>
          <p className="text-muted-foreground">Store identity and operational defaults</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          Save changes
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Name, URLs, and inventory alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Banner URL</Label>
              <Input
                value={form.bannerUrl ?? ""}
                onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                value={form.taxRate ?? 0}
                onChange={(e) =>
                  setForm({ ...form, taxRate: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Low stock threshold</Label>
              <Input
                type="number"
                value={form.lowStockThreshold ?? 5}
                onChange={(e) =>
                  setForm({
                    ...form,
                    lowStockThreshold: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isPublic ?? false}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="size-4 rounded"
            />
            <span className="text-sm">Public marketplace listing</span>
          </label>
          {form.slug && (
            <p className="text-sm text-muted-foreground">
              Store: /store/{form.slug}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
