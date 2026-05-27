"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiResponse } from "@/lib/api-client";
import {
  getTenantContextState,
  PLATFORM_OFFICE_SLUG,
} from "@/lib/platform/tenant-context";

type TenantOption = { id: string; name: string; slug: string };

export function TenantSwitcher() {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const isPlatformAdmin = session?.user?.role === "PLATFORM_ADMIN";
  const [pendingTenant, setPendingTenant] = useState<TenantOption | null>(null);

  const { data: tenants = [] } = useQuery({
    queryKey: ["platform-tenants"],
    enabled: isPlatformAdmin,
    queryFn: async () => {
      const res = await fetch("/api/platform/tenants");
      return parseApiResponse<TenantOption[]>(res);
    },
  });

  const switchMutation = useMutation({
    mutationFn: async (businessId: string) => {
      await update({ businessId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setPendingTenant(null);
      toast.success("Switched business context");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isPlatformAdmin || tenants.length === 0) return null;

  const current = session?.user?.businessId ?? "";
  const contextState = getTenantContextState({
    currentBusinessId: current,
    tenants,
  });
  const pendingIsOffice = pendingTenant?.slug === PLATFORM_OFFICE_SLUG;

  return (
    <>
      <div className="mb-6 space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-900/70">
          Select a Business
        </p>
        <Select
          value={current}
          onValueChange={(id) => {
            const tenant = tenants.find((t) => t.id === id);
            if (tenant && id !== current) setPendingTenant(tenant);
          }}
        >
          <SelectTrigger className="h-9 w-full bg-white text-sm">
            <SelectValue placeholder="Select a business" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] leading-snug text-amber-950/80">
          {contextState.isOfficeContext
            ? "General Office is selected. Choose a tenant business to view store menus and data."
            : `Viewing store data for ${contextState.currentBusinessName}.`}
        </p>
      </div>

      <Dialog
        open={Boolean(pendingTenant)}
        onOpenChange={(open) => {
          if (!open && !switchMutation.isPending) setPendingTenant(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch business context?</DialogTitle>
            <DialogDescription>
              {pendingIsOffice ? (
                <>
                  Confirm that you want to return to{" "}
                  <span className="font-medium text-foreground">
                    {pendingTenant?.name}
                  </span>
                  . Tenant menus and store data will be hidden.
                </>
              ) : (
                <>
                  Confirm that you want to view menus and store data for{" "}
                  <span className="font-medium text-foreground">
                    {pendingTenant?.name}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={switchMutation.isPending}
              onClick={() => setPendingTenant(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!pendingTenant || switchMutation.isPending}
              onClick={() => {
                if (pendingTenant) switchMutation.mutate(pendingTenant.id);
              }}
            >
              {switchMutation.isPending ? "Switching..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
