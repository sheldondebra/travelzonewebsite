"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Mail,
  Package,
  Phone,
  Save,
  Sparkles,
  Truck,
  User,
  UserRound,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextAreaField } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const SUPPLIER_TYPES = [
  "Manufacturer",
  "Wholesaler",
  "Distributor",
  "Importer",
  "Local vendor",
] as const;

function SectionCard({
  title,
  description,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof Truck;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex items-start gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/20 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
            iconClass,
          )}
        >
          <Icon className="size-5 text-white" strokeWidth={2} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function IconField({
  id,
  label,
  icon: Icon,
  iconTone,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  icon: typeof Phone;
  iconTone: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <span
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg",
            iconTone,
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <Input
          id={id}
          name={id}
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl border-primary/15 bg-brand-cream/15 pl-[3.25rem] shadow-none focus-visible:border-primary/40 focus-visible:bg-white"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PreviewCard({
  name,
  contact,
  phone,
  email,
  supplierType,
  notes,
}: {
  name: string;
  contact: string;
  phone: string;
  email: string;
  supplierType: string;
  notes: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-white via-brand-cream/30 to-brand-rose/20 shadow-card">
      <div className="border-b border-primary/10 bg-primary/10 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </p>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-xl font-bold text-white shadow-md">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {name.trim() || "Supplier name"}
            </p>
            {supplierType ? (
              <span className="mt-1 inline-flex rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                {supplierType}
              </span>
            ) : (
              <p className="text-sm text-muted-foreground">Vendor profile</p>
            )}
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="size-4 shrink-0 text-violet-500" />
            <span className={contact ? "font-medium text-foreground" : ""}>
              {contact || "No contact person"}
            </span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0 text-emerald-500" />
            <span className={phone ? "font-medium text-foreground" : ""}>
              {phone || "No phone"}
            </span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0 text-orange-500" />
            <span className={cn("truncate", email && "font-medium text-foreground")}>
              {email || "No email"}
            </span>
          </li>
        </ul>

        {notes.trim() && (
          <div className="rounded-xl border border-primary/10 bg-white/80 p-3 text-sm text-muted-foreground">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide">Notes</p>
            <p className="line-clamp-4 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/20 bg-white/60 px-3 py-2.5 text-xs text-muted-foreground">
          <Package className="size-4 shrink-0 text-primary" />
          Ready for purchase orders after saving
        </div>
      </div>
    </div>
  );
}

export function CreateSupplierForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [supplierType, setSupplierType] = useState<string>("");

  const completion = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 40;
    if (contact.trim() || phone.trim() || email.trim()) score += 30;
    if (supplierType) score += 15;
    if (notes.trim()) score += 15;
    return score;
  }, [name, contact, phone, email, supplierType, notes]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const composedNotes = [
        supplierType ? `Type: ${supplierType}` : null,
        notes.trim() || null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: composedNotes || undefined,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created");
      router.push("/dashboard/suppliers");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    createMutation.mutate();
  }

  return (
    <PageShell
      size="wide"
      className="space-y-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8"
    >
      <Link
        href="/dashboard/suppliers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Suppliers
      </Link>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-sky-500/25 via-brand-rose/40 to-brand-cream px-4 py-5 shadow-soft sm:px-6 sm:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full bg-sky-400/30 blur-2xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md sm:size-14">
              <Truck className="size-6 sm:size-7" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Procurement
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                New supplier
              </h1>
              <p className="mt-0.5 max-w-lg text-sm text-foreground/75">
                Add a vendor for purchase orders, stock replenishment, and supply
                tracking.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="min-w-[4.5rem]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Profile
              </p>
              <p className="text-lg font-bold tabular-nums text-sky-700">{completion}%</p>
            </div>
            <div className="h-10 w-px bg-border/80" />
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </div>
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-primary transition-all duration-300"
            style={{ width: `${completion}%` }}
          />
        </div>
      </header>

      <form id="create-supplier-form" onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <div className="space-y-5 lg:col-span-3">
          <SectionCard
            title="Company"
            description="Business or vendor name"
            icon={Building2}
            iconClass="bg-gradient-to-br from-violet-500 to-violet-600"
          >
            <IconField
              id="name"
              label="Supplier name"
              icon={Building2}
              iconTone="bg-violet-500/15 text-violet-700"
              value={name}
              onChange={setName}
              required
              placeholder="e.g. Accra Textiles Ltd"
              hint="Use the legal or trading name you will see on invoices"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier type</Label>
              <div className="flex flex-wrap gap-2">
                {SUPPLIER_TYPES.map((type) => {
                  const active = supplierType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSupplierType(active ? "" : type)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-semibold transition-all touch-manipulation",
                        active
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                          : "bg-muted/60 text-muted-foreground ring-1 ring-primary/10 hover:bg-brand-rose/30",
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Contact person"
            description="Who to reach for orders & quotes"
            icon={User}
            iconClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          >
            <IconField
              id="contact"
              label="Contact name"
              icon={UserRound}
              iconTone="bg-emerald-500/15 text-emerald-700"
              value={contact}
              onChange={setContact}
              placeholder="e.g. Kwame Mensah"
            />
          </SectionCard>

          <SectionCard
            title="Communication"
            description="Phone and email for POs and follow-ups"
            icon={Phone}
            iconClass="bg-gradient-to-br from-orange-400 to-orange-500"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <IconField
                id="phone"
                label="Phone"
                icon={Phone}
                iconTone="bg-sky-500/15 text-sky-700"
                value={phone}
                onChange={setPhone}
                type="tel"
                placeholder="+233 …"
              />
              <IconField
                id="email"
                label="Email"
                icon={Mail}
                iconTone="bg-orange-500/15 text-orange-700"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="orders@vendor.com"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Notes & terms"
            description="Payment terms, lead times, or special instructions"
            icon={ClipboardList}
            iconClass="bg-gradient-to-br from-amber-500 to-amber-600"
          >
            <TextAreaField
              label="Internal notes"
              value={notes}
              onChange={setNotes}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              e.g. Net 30, MOQ 50 units, delivers Tuesdays only
            </p>
          </SectionCard>

          <div className="hidden gap-3 lg:flex">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => router.push("/dashboard/suppliers")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 gap-2 rounded-xl font-semibold shadow-soft"
              disabled={createMutation.isPending || !name.trim()}
            >
              <Save className="size-4" />
              {createMutation.isPending ? "Saving…" : "Save supplier"}
            </Button>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-2">
          <PreviewCard
            name={name}
            contact={contact}
            phone={phone}
            email={email}
            supplierType={supplierType}
            notes={notes}
          />

          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 to-brand-rose/15 p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="text-sm">
                <p className="font-semibold">After saving</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Truck className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
                    Create purchase orders from the suppliers page
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="mt-0.5 size-3.5 shrink-0 text-violet-600" />
                    Track stock received against this vendor
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/suppliers/import"
            className={buttonVariants({
              variant: "outline",
              className: "h-11 w-full rounded-xl",
            })}
          >
            Import suppliers from spreadsheet
          </Link>
        </aside>
      </form>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav-offset,4.5rem)] z-40 flex gap-2 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onClick={() => router.push("/dashboard/suppliers")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-supplier-form"
          className="h-11 flex-1 gap-2 rounded-xl font-semibold shadow-soft"
          disabled={createMutation.isPending || !name.trim()}
        >
          <Save className="size-4" />
          {createMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </PageShell>
  );
}
