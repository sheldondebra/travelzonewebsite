"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Save,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CUSTOMER_TAGS } from "@/server/validations/customer";

export function CreateCustomerForm({
  defaultEnableLogin = false,
}: {
  defaultEnableLogin?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [enableLogin, setEnableLogin] = useState(defaultEnableLogin);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
      router.push(
        enableLogin
          ? "/dashboard/people/customers/with-login"
          : "/dashboard/people/customers",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      name: form.get("name") as string,
      phone: (form.get("phone") as string) || undefined,
      email: (form.get("email") as string) || "",
      notes: (form.get("notes") as string) || undefined,
      tags,
      enableLogin,
      portalPassword: enableLogin
        ? (form.get("portalPassword") as string)
        : undefined,
    });
  }

  return (
    <PageShell size="wide" className="pb-10">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-cream via-white to-brand-rose/40 p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <User className="size-6" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Customer profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Create customer
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Add a buyer profile for orders, customer history, and optional
                storefront login.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-fit rounded-xl bg-white/80"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-soft">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white via-brand-cream/70 to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <Users className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <CardTitle>Basic details</CardTitle>
                  <CardDescription>
                    These details make the customer easy to find at checkout.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  id="name"
                  label="Customer name"
                  hint="Use the name the customer normally gives you."
                >
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Example: Ama Mensah"
                    className="h-12 rounded-2xl border-gray-200 bg-white shadow-sm"
                  />
                </FormField>
                <FormField
                  id="phone"
                  label="Phone number"
                  hint="Useful for receipts, delivery calls, and follow-ups."
                >
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      inputMode="tel"
                      placeholder="Example: 024 123 4567"
                      className="h-12 rounded-2xl border-gray-200 bg-white pl-11 shadow-sm"
                    />
                  </div>
                </FormField>
              </div>

              <FormField
                id="email"
                label="Email address"
                hint="Optional. Required only if you want the customer to log in with email."
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Example: ama@example.com"
                    className="h-12 rounded-2xl border-gray-200 bg-white pl-11 shadow-sm"
                  />
                </div>
              </FormField>

              <FormField
                id="notes"
                label="Customer notes"
                hint="Add preferences, delivery instructions, or anything your team should remember."
              >
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Example: Prefers WhatsApp updates and weekend delivery."
                  className="min-h-28 rounded-2xl border-gray-200 bg-white px-4 py-3 shadow-sm focus-visible:border-primary focus-visible:ring-primary/30"
                />
              </FormField>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-soft">
            <CardHeader className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Sparkles className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <CardTitle>Customer tags</CardTitle>
                  <CardDescription>
                    Select helpful labels for filtering and customer service.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2.5">
                {CUSTOMER_TAGS.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setTags((current) =>
                          current.includes(tag)
                            ? current.filter((item) => item !== tag)
                            : [...current, tag],
                        )
                      }
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all touch-manipulation",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border-gray-100 bg-white text-muted-foreground hover:border-primary/20 hover:bg-brand-cream/60 hover:text-foreground",
                      )}
                    >
                      {selected && <CheckCircle2 className="size-4" strokeWidth={2} />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="sticky top-24 border-primary/10 shadow-soft">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-white to-brand-cream/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <KeyRound className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <CardTitle>Portal access</CardTitle>
                  <CardDescription>
                    Optional login for the customer storefront.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-brand-cream/40">
                <Checkbox
                  className="mt-0.5"
                  checked={enableLogin}
                  onCheckedChange={(checked) => setEnableLogin(Boolean(checked))}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    Enable portal login
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    Creates a login account linked to this customer profile.
                  </span>
                </span>
              </label>

              {enableLogin && (
                <FormField
                  id="portalPassword"
                  label="Temporary password"
                  hint="Minimum 8 characters. Share it with the customer securely."
                >
                  <Input
                    id="portalPassword"
                    name="portalPassword"
                    type="password"
                    required={enableLogin}
                    minLength={8}
                    placeholder="Example: Customer@123"
                    className="h-12 rounded-2xl border-gray-200 bg-white shadow-sm"
                  />
                </FormField>
              )}

              <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
                Tip: phone and notes help your team recognize customers faster,
                even when portal login is disabled.
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl text-sm font-semibold shadow-soft"
                disabled={createMutation.isPending}
              >
                <Save className="size-4" />
                {createMutation.isPending ? "Saving customer..." : "Save customer"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </PageShell>
  );
}

function FormField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
