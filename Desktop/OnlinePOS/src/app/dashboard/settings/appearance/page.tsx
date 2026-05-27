"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, TextField, Toggle } from "@/components/settings/fields";

export default function AppearanceSettingsPage() {
  return (
    <SettingsPageShell
      title="Dynamic appearance"
      description="Brand colors and dashboard look & feel"
      section="appearance"
    >
      {(s, u) => (
        <>
          <TextField
            label="Primary color"
            type="color"
            value={s.appearance.primaryColor}
            onChange={(v) => u({ primaryColor: v })}
          />
          <SelectField
            label="Sidebar style"
            value={s.appearance.sidebarStyle}
            onChange={(v) =>
              u({ sidebarStyle: v as "cream" | "white" })
            }
            options={[
              { value: "cream", label: "Cream (default)" },
              { value: "white", label: "White" },
            ]}
          />
          <Toggle
            label="Compact mode"
            checked={s.appearance.compactMode}
            onChange={(v) => u({ compactMode: v })}
            description="Tighter spacing in tables and lists"
          />
          <Toggle
            label="Show Tecunit branding"
            checked={s.appearance.showBranding}
            onChange={(v) => u({ showBranding: v })}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
