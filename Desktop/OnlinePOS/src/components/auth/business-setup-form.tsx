"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export function BusinessSetupForm() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });

    setLoading(false);

    let business: { id: string };
    try {
      business = await parseApiResponse<{ id: string }>(res);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create business",
      );
      return;
    }

    await update({ businessId: business.id });
    toast.success("Business created");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full shadow-soft">
      <CardHeader className="sr-only">
        <CardTitle>Set up your business</CardTitle>
        <CardDescription>
          This keeps your products, orders, and customers separate from other
          sellers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" required placeholder="My Shop" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
