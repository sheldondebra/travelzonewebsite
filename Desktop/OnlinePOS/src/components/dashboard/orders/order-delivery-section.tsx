"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Globe,
  Hash,
  Loader2,
  MessageSquare,
  PackageCheck,
  Phone,
  Save,
  Send,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DeliveryAddressAutocomplete } from "@/components/dashboard/orders/delivery-address-autocomplete";
import { DeliveryMapPreview } from "@/components/dashboard/orders/delivery-map-preview";
import {
  ACTIVE_DELIVERY_STATUSES,
  type DeliveryDetails,
  type DeliveryStatus,
  DELIVERY_STATUS_UI,
  deliveryStatusMeta,
  getDeliveryFromMeta,
  isDeliveryRequired,
} from "@/lib/orders/delivery";
import {
  GHANA_REGIONS,
  getCitiesForRegion,
  normalizeGhanaCity,
  normalizeGhanaRegion,
  searchAllCities,
} from "@/lib/orders/ghana-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-xl border border-gray-200 bg-white pl-10 shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20";

const textareaClass =
  "min-h-[96px] rounded-xl border border-gray-200 bg-white pt-3 pl-10 shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20";

type Props = {
  orderId: string;
  orderRef: string;
  customerName: string;
  deliveryStatus: string;
  legacyMeta: unknown;
  customerPhone?: string | null;
  disabled?: boolean;
};

function DeliveryField({
  id,
  label,
  icon: Icon,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function DeliveryTextareaField({
  id,
  label,
  icon: Icon,
  className,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function DeliveryStatusPicker({
  value,
  disabled,
  saving,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  saving?: boolean;
  onChange: (status: DeliveryStatus) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Delivery status
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ACTIVE_DELIVERY_STATUSES.map((s) => {
          const ui = DELIVERY_STATUS_UI[s];
          const Icon = ui.icon;
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled || saving}
              onClick={() => onChange(s)}
              className={cn(
                "group flex flex-col items-center gap-2.5 rounded-xl border-2 px-2 py-3.5 transition-all touch-manipulation",
                active ? ui.cardActive : ui.card,
                (disabled || saving) && "pointer-events-none opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-colors",
                  active ? ui.iconWrapActive : ui.iconWrap,
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span className="text-center text-xs font-semibold leading-tight">
                {ui.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
      <div className="hidden items-center gap-1 px-1 sm:flex">
        {ACTIVE_DELIVERY_STATUSES.map((s, i) => {
          const ui = DELIVERY_STATUS_UI[s];
          const idx = ACTIVE_DELIVERY_STATUSES.indexOf(value as DeliveryStatus);
          const done = idx >= i;
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  done ? ui.dot : "bg-gray-200",
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function emptyForm(
  saved: DeliveryDetails,
  customerPhone?: string | null,
): DeliveryDetails {
  return {
    address: saved.address ?? "",
    formattedAddress: saved.formattedAddress ?? "",
    city: saved.city ?? "",
    region: saved.region ?? "",
    phone: saved.phone ?? customerPhone ?? "",
    notes: saved.notes ?? "",
    scheduledAt: saved.scheduledAt ?? null,
    carrier: saved.carrier ?? "",
    riderName: saved.riderName ?? "",
    riderPhone: saved.riderPhone ?? "",
    trackingNumber: saved.trackingNumber ?? "",
    placeId: saved.placeId ?? "",
    latitude: saved.latitude,
    longitude: saved.longitude,
  };
}

export function OrderDeliverySection({
  orderId,
  orderRef,
  customerName,
  deliveryStatus,
  legacyMeta,
  customerPhone,
  disabled,
}: Props) {
  const queryClient = useQueryClient();
  const savedDetails = getDeliveryFromMeta(legacyMeta);
  const deliveryOn = isDeliveryRequired(deliveryStatus);
  const statusMeta = deliveryStatusMeta(deliveryStatus);

  const [required, setRequired] = useState(deliveryOn);
  const [status, setStatus] = useState(deliveryStatus);
  const [form, setForm] = useState<DeliveryDetails>(() =>
    emptyForm(savedDetails, customerPhone),
  );
  const [dirty, setDirty] = useState(false);

  const cityOptions = useMemo(() => {
    if (form.region) return getCitiesForRegion(form.region);
    return searchAllCities("");
  }, [form.region]);

  useEffect(() => {
    setRequired(isDeliveryRequired(deliveryStatus));
    setStatus(deliveryStatus);
    setForm(emptyForm(getDeliveryFromMeta(legacyMeta), customerPhone));
    setDirty(false);
  }, [deliveryStatus, legacyMeta, customerPhone]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      deliveryRequired?: boolean;
      deliveryStatus?: string;
      deliveryDetails?: DeliveryDetails;
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-stats"] });
      toast.success("Delivery updated");
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const riderSmsMutation = useMutation({
    mutationFn: async () => {
      if (dirty) {
        await saveMutation.mutateAsync({
          deliveryRequired: required,
          deliveryStatus: status,
          deliveryDetails: buildDetails(),
        });
      }
      const res = await fetch(`/api/orders/${orderId}/delivery/rider-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderPhone: form.riderPhone?.trim() || undefined,
        }),
      });
      return parseApiResponse<{ sent: boolean; mapsUrl: string }>(res);
    },
    onSuccess: (data) => {
      toast.success("Delivery details sent to rider");
      if (data.mapsUrl) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function buildDetails(): DeliveryDetails {
    return {
      address: form.address?.trim() || undefined,
      formattedAddress: form.formattedAddress?.trim() || undefined,
      city: form.city?.trim() || undefined,
      region: form.region?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      scheduledAt: form.scheduledAt || undefined,
      carrier: form.carrier?.trim() || undefined,
      riderName: form.riderName?.trim() || undefined,
      riderPhone: form.riderPhone?.trim() || undefined,
      trackingNumber: form.trackingNumber?.trim() || undefined,
      placeId: form.placeId || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
    };
  }

  function patchForm(next: Partial<DeliveryDetails>) {
    setForm((prev) => ({ ...prev, ...next }));
    setDirty(true);
  }

  function handleAddressSelect(patch: Partial<DeliveryDetails>) {
    const region = normalizeGhanaRegion(patch.region) ?? patch.region;
    const city = normalizeGhanaCity(patch.city, region) ?? patch.city;
    patchForm({
      ...patch,
      region,
      city,
    });
  }

  function handleToggle(checked: boolean) {
    setRequired(checked);
    const nextStatus = checked ? "pending" : "pickup";
    setStatus(nextStatus);
    saveMutation.mutate({ deliveryRequired: checked, deliveryStatus: nextStatus });
  }

  function handleStatusChange(next: DeliveryStatus) {
    setStatus(next);
    saveMutation.mutate({
      deliveryRequired: true,
      deliveryStatus: next,
      deliveryDetails: buildDetails(),
    });
  }

  function handleSave() {
    saveMutation.mutate({
      deliveryRequired: required,
      deliveryStatus: status,
      deliveryDetails: buildDetails(),
    });
  }

  const saving = saveMutation.isPending;
  const sendingSms = riderSmsMutation.isPending;

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-primary/10 bg-gradient-to-r from-brand-cream/40 to-brand-rose/20 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-800">
            <Truck className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Delivery</h2>
            <p className="text-sm text-muted-foreground">
              Address lookup, map pin, and rider SMS
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
            statusMeta.badge,
          )}
        >
          <span className={cn("size-1.5 rounded-full", statusMeta.dot)} />
          {statusMeta.label}
        </span>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-xl border-2 px-4 py-4 transition-all",
            required
              ? "border-orange-400/70 bg-gradient-to-r from-orange-500/15 via-brand-rose/30 to-brand-cream/50 shadow-sm"
              : "border-gray-200 bg-gray-50/90",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Delivery required</p>
              {required && (
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  On
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {required
                ? "Ship or deliver to customer address"
                : "Customer pickup or in-store sale"}
            </p>
          </div>
          <Switch
            checked={required}
            disabled={disabled || saving}
            onCheckedChange={handleToggle}
            aria-label="Delivery required"
            className="shrink-0"
          />
        </div>

        {required && (
          <>
            <DeliveryStatusPicker
              value={status}
              disabled={disabled}
              saving={saving}
              onChange={handleStatusChange}
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery address</Label>
              <DeliveryAddressAutocomplete
                value={form.address ?? ""}
                disabled={disabled || saving}
                onManualChange={(address) =>
                  patchForm({ address, formattedAddress: undefined, placeId: undefined })
                }
                onSelect={handleAddressSelect}
              />
              <p className="text-xs text-muted-foreground">
                Type at least 3 characters — pick a suggestion to save map coordinates.
              </p>
            </div>

            <DeliveryMapPreview delivery={form} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="size-3.5" />
                  Region
                </Label>
                <SearchableSelect
                  value={form.region ?? ""}
                  onChange={(region) => {
                    patchForm({ region, city: "" });
                  }}
                  options={[...GHANA_REGIONS]}
                  placeholder="Select region"
                  searchPlaceholder="Search regions…"
                  disabled={disabled || saving}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">City / area</Label>
                <SearchableSelect
                  value={form.city ?? ""}
                  onChange={(city) => patchForm({ city })}
                  options={cityOptions}
                  placeholder={form.region ? "Select city" : "Select region first"}
                  searchPlaceholder="Search cities…"
                  emptyMessage={
                    form.region ? "No cities in this region" : "Pick a region first"
                  }
                  disabled={disabled || saving || !form.region}
                />
              </div>

              <DeliveryField id="delivery-phone" label="Contact phone" icon={Phone}>
                <Input
                  id="delivery-phone"
                  className={fieldClass}
                  placeholder="Delivery contact number"
                  value={form.phone ?? ""}
                  disabled={disabled || saving}
                  onChange={(e) => patchForm({ phone: e.target.value })}
                />
              </DeliveryField>

              <DeliveryField
                id="delivery-scheduled"
                label="Scheduled date"
                icon={Calendar}
              >
                <Input
                  id="delivery-scheduled"
                  type="datetime-local"
                  className={fieldClass}
                  value={
                    form.scheduledAt
                      ? format(new Date(form.scheduledAt), "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  disabled={disabled || saving}
                  onChange={(e) =>
                    patchForm({
                      scheduledAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </DeliveryField>

              <DeliveryTextareaField
                id="delivery-notes"
                label="Delivery notes"
                icon={MessageSquare}
                className="sm:col-span-2"
              >
                <Textarea
                  id="delivery-notes"
                  className={textareaClass}
                  placeholder="Gate code, preferred time, fragile items…"
                  value={form.notes ?? ""}
                  disabled={disabled || saving}
                  onChange={(e) => patchForm({ notes: e.target.value })}
                />
              </DeliveryTextareaField>
            </div>

            {/* Rider */}
            <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50/60 to-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Rider assignment</h3>
                  <p className="text-xs text-muted-foreground">
                    Send {orderRef} delivery details + Google Maps link via SMS
                  </p>
                </div>
                <Button
                  type="button"
                  className="rounded-xl font-semibold shadow-soft"
                  disabled={
                    disabled || sendingSms || saving || !form.riderPhone?.trim()
                  }
                  onClick={() => riderSmsMutation.mutate()}
                >
                  {sendingSms ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
                  Send rider SMS
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DeliveryField id="rider-name" label="Rider name" icon={User}>
                  <Input
                    id="rider-name"
                    className={fieldClass}
                    placeholder="Rider or courier name"
                    value={form.riderName ?? ""}
                    disabled={disabled || saving}
                    onChange={(e) => patchForm({ riderName: e.target.value })}
                  />
                </DeliveryField>

                <DeliveryField id="rider-phone" label="Rider phone" icon={Phone}>
                  <Input
                    id="rider-phone"
                    className={fieldClass}
                    placeholder="Rider mobile for SMS"
                    value={form.riderPhone ?? ""}
                    disabled={disabled || saving}
                    onChange={(e) => patchForm({ riderPhone: e.target.value })}
                  />
                </DeliveryField>

                <DeliveryField id="delivery-carrier" label="Carrier / company" icon={Truck}>
                  <Input
                    id="delivery-carrier"
                    className={fieldClass}
                    placeholder="e.g. Bolt, in-house"
                    value={form.carrier ?? ""}
                    disabled={disabled || saving}
                    onChange={(e) => patchForm({ carrier: e.target.value })}
                  />
                </DeliveryField>

                <DeliveryField
                  id="delivery-tracking"
                  label="Tracking / reference"
                  icon={Hash}
                >
                  <Input
                    id="delivery-tracking"
                    className={fieldClass}
                    placeholder="Optional tracking number"
                    value={form.trackingNumber ?? ""}
                    disabled={disabled || saving}
                    onChange={(e) => patchForm({ trackingNumber: e.target.value })}
                  />
                </DeliveryField>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                SMS includes customer ({customerName}), address, notes, and a Google Maps
                link. Requires SMS enabled in Settings.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                className="rounded-xl font-semibold shadow-soft"
                disabled={disabled || saving || !dirty}
                onClick={handleSave}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save delivery details
              </Button>
            </div>
          </>
        )}

        {!required && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-sm text-muted-foreground">
            <PackageCheck className="size-5 shrink-0 text-primary" />
            <p>No delivery — customer collects in store or at pickup point.</p>
          </div>
        )}
      </div>
    </section>
  );
}
