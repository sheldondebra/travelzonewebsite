"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField } from "@/components/settings/fields";

export default function LanguagesSettingsPage() {
  return (
    <SettingsPageShell
      title="Languages"
      description="Locale and date/time formats"
      section="language"
    >
      {(s, u) => (
        <>
          <SelectField
            label="Default language"
            value={s.language.defaultLocale}
            onChange={(v) => u({ defaultLocale: v })}
            options={[
              { value: "en", label: "English" },
              { value: "fr", label: "French" },
              { value: "tw", label: "Twi" },
            ]}
          />
          <SelectField
            label="Date format"
            value={s.language.dateFormat}
            onChange={(v) => u({ dateFormat: v })}
            options={[
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
          />
          <SelectField
            label="Time format"
            value={s.language.timeFormat}
            onChange={(v) => u({ timeFormat: v as "12h" | "24h" })}
            options={[
              { value: "12h", label: "12-hour" },
              { value: "24h", label: "24-hour" },
            ]}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
