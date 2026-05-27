"use client";

import Link from "next/link";
import { SettingsPageShell } from "@/components/settings/settings-shell";
import { TextField, Toggle } from "@/components/settings/fields";
import { buttonVariants } from "@/components/ui/button";

export default function WarehouseSettingsPage() {
  return (
    <SettingsPageShell
      title="Warehouse"
      description="Inventory location and stock rules"
      section="warehouse"
    >
      {(s, u) => (
        <>
          <Toggle
            label="Enable multi-warehouse"
            checked={s.warehouse.enabled}
            onChange={(v) => u({ enabled: v })}
            description="Creates a default warehouse when enabled if none exists"
          />
          <TextField
            label="Default warehouse name"
            value={s.warehouse.defaultName}
            onChange={(v) => u({ defaultName: v })}
          />
          <Toggle
            label="Allow negative stock"
            checked={s.warehouse.allowNegativeStock}
            onChange={(v) => u({ allowNegativeStock: v })}
            description="When off, POS sales block if stock is insufficient"
          />
          <Link
            href="/dashboard/products/warehouses"
            className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
          >
            Manage warehouse locations
          </Link>
        </>
      )}
    </SettingsPageShell>
  );
}
