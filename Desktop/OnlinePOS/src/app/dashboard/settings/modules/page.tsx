"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { Toggle } from "@/components/settings/fields";

export default function ModuleSettingsPage() {
  return (
    <SettingsPageShell
      title="Module settings"
      description="Enable or disable features for your workspace"
      section="modules"
    >
      {(s, u) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="POS"
            checked={s.modules.pos}
            onChange={(v) => u({ pos: v })}
          />
          <Toggle
            label="Marketplace"
            checked={s.modules.marketplace}
            onChange={(v) => u({ marketplace: v })}
          />
          <Toggle
            label="Suppliers"
            checked={s.modules.suppliers}
            onChange={(v) => u({ suppliers: v })}
          />
          <Toggle
            label="Analytics"
            checked={s.modules.analytics}
            onChange={(v) => u({ analytics: v })}
          />
          <Toggle
            label="Tasks"
            checked={s.modules.tasks}
            onChange={(v) => u({ tasks: v })}
          />
        </div>
      )}
    </SettingsPageShell>
  );
}
