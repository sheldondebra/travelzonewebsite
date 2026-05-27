"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, Toggle } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";

export default function BackupSettingsPage() {
  const queryClient = useQueryClient();
  const [backupJson, setBackupJson] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/settings?action=backup", { method: "POST" });
      const data = await parseApiResponse<{
        exportedAt: string;
        version: number;
        settings: unknown;
      }>(res);
      const json = JSON.stringify(data, null, 2);
      setBackupJson(json);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SettingsPageShell
      title="Backup"
      description="Export settings and configuration"
      section="backup"
    >
      {(s, u) => (
        <>
          <Toggle
            label="Automatic backup"
            checked={s.backup.autoBackup}
            onChange={(v) => u({ autoBackup: v })}
            description="Scheduled backups require server cron — manual download always works"
          />
          <SelectField
            label="Frequency"
            value={s.backup.frequency}
            onChange={(v) =>
              u({ frequency: v as "daily" | "weekly" | "monthly" })
            }
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
          {s.backup.lastBackupAt && (
            <p className="text-sm text-muted-foreground">
              Last backup: {new Date(s.backup.lastBackupAt).toLocaleString()}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={downloadBackup}
            disabled={downloading}
          >
            {downloading ? "Generating…" : "Download settings backup now"}
          </Button>
          {backupJson && (
            <pre className="max-h-40 overflow-auto rounded-xl bg-muted/40 p-3 text-xs">
              {backupJson.slice(0, 500)}…
            </pre>
          )}
        </>
      )}
    </SettingsPageShell>
  );
}
