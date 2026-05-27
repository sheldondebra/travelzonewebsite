"use client";

import { useState } from "react";
import {
  ChevronRight,
  Loader2,
  Phone,
  Search,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { pos } from "@/components/pos/pos-styles";
import type { PosCustomer } from "@/stores/pos-cart";
import { capitalizeLabel } from "@/lib/format-label";

function CustomerAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-rose/80 to-brand-cream text-xs font-bold text-foreground shadow-sm">
      {initial}
    </span>
  );
}

export function PosCustomerDialog({
  open,
  onOpenChange,
  customers,
  selectedId,
  walkInLoading,
  createPending,
  onSelect,
  onWalkIn,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: PosCustomer[];
  selectedId?: string | null;
  walkInLoading: boolean;
  createPending: boolean;
  onSelect: (customer: PosCustomer) => void;
  onWalkIn: () => void;
  onCreate: (name: string, phone?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const filtered = customers.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search),
  );

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim(), phone.trim() || undefined);
    setName("");
    setPhone("");
    setShowQuickAdd(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden rounded-2xl border-gray-100/80 p-0 shadow-elevated sm:max-w-[400px]"
      >
        <DialogHeader className="border-b border-gray-100/80 bg-gradient-to-br from-brand-rose/45 via-white to-brand-cream px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold tracking-tight">
            <Users className="size-4 text-primary" />
            {capitalizeLabel("Select customer")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {capitalizeLabel("Link this sale to a customer profile")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className={cn(pos.input, "pl-9")}
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full rounded-xl bg-[#F7F7F8] text-sm font-semibold hover:bg-brand-rose/40"
            disabled={walkInLoading}
            onClick={onWalkIn}
          >
            {walkInLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <User className="mr-2 size-4" />
            )}
            {capitalizeLabel("Walk-in customer")}
          </Button>
        </div>

        <div className="max-h-[min(42vh,300px)] overflow-y-auto border-y border-gray-100/80 px-2 py-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              {capitalizeLabel("No customers match your search")}
            </p>
          ) : (
            filtered.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all touch-manipulation",
                    active
                      ? "bg-primary/12 ring-1 ring-primary/25"
                      : "hover:bg-brand-rose/25 active:bg-brand-rose/40",
                  )}
                >
                  <CustomerAvatar name={c.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {capitalizeLabel(c.name)}
                    </span>
                    {c.phone && (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Phone className="size-3 shrink-0" />
                        {c.phone}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-4">
          {!showQuickAdd ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl border-gray-100/80 text-sm font-medium"
              onClick={() => setShowQuickAdd(true)}
            >
              <UserPlus className="mr-2 size-4" />
              {capitalizeLabel("New customer")}
            </Button>
          ) : (
            <div className="space-y-2.5 rounded-xl border border-gray-100/80 bg-[#F7F7F8]/80 p-3">
              <Label className={pos.sectionLabel}>{capitalizeLabel("Quick add")}</Label>
              <Input
                className="h-10 rounded-xl bg-white text-sm"
                placeholder="Customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                className="h-10 rounded-xl bg-white text-sm"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="flex gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowQuickAdd(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl font-semibold"
                  disabled={!name.trim() || createPending}
                  onClick={handleCreate}
                >
                  {createPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    capitalizeLabel("Add customer")
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PosCustomerTrigger({
  customer,
  onClick,
}: {
  customer: PosCustomer | null;
  onClick: () => void;
}) {
  const initial = customer?.name.trim().charAt(0).toUpperCase() ?? null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all touch-manipulation",
        customer
          ? "border-primary/20 bg-white shadow-card ring-1 ring-primary/10"
          : "border-dashed border-gray-200 bg-white/80 hover:border-primary/30 hover:bg-brand-rose/20",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
          customer
            ? "bg-gradient-to-br from-brand-rose to-brand-cream text-foreground shadow-sm"
            : "bg-[#F7F7F8] text-muted-foreground",
        )}
      >
        {initial ?? <User className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        {customer ? (
          <>
            <span className="block truncate text-sm font-semibold">
              {capitalizeLabel(customer.name)}
            </span>
            {customer.phone ? (
              <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Phone className="size-3 shrink-0" />
                {customer.phone}
              </span>
            ) : (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {capitalizeLabel("No phone on file")}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="block text-sm font-semibold">
              {capitalizeLabel("Select customer")}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {capitalizeLabel("Required before checkout")}
            </span>
          </>
        )}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
