"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextAreaField } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type SmsTemplateRow = {
  key: string;
  title: string;
  message: string;
  isCustom: boolean;
  isActive: boolean;
  variables: string[];
};

export function SmsTemplateEditor() {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", message: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const res = await fetch("/api/sms/templates");
      return parseApiResponse<SmsTemplateRow[]>(res);
    },
  });

  const active =
    templates.find((t) => t.key === activeKey) ?? templates[0] ?? null;

  useEffect(() => {
    if (active) {
      setDraft({ title: active.title, message: active.message });
    }
  }, [active?.key, active?.title, active?.message]);

  const selectTemplate = (tpl: SmsTemplateRow) => {
    setActiveKey(tpl.key);
    setDraft({ title: tpl.title, message: tpl.message });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("No template selected");
      const res = await fetch("/api/sms/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: active.key,
          title: draft.title,
          message: draft.message,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch("/api/sms/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("Reset to platform default");
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading templates…</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
        <div className="border-b border-primary/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Templates
          </p>
        </div>
        <ul className="max-h-[480px] overflow-y-auto divide-y divide-primary/10">
          {templates.map((tpl) => (
            <li key={tpl.key}>
              <button
                type="button"
                onClick={() => selectTemplate(tpl)}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-brand-cream/40",
                  (active?.key === tpl.key || (!activeKey && tpl === templates[0])) &&
                    "bg-brand-rose/15 font-medium",
                )}
              >
                {tpl.title}
                {tpl.isCustom && (
                  <span className="ml-2 text-[10px] uppercase text-primary">Custom</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {active && (
        <div className="space-y-4 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{active.title}</h2>
              <p className="text-sm text-muted-foreground">
                Use {"{{variable}}"} placeholders in your message.
              </p>
            </div>
            <div className="flex gap-2">
              {active.isCustom && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={() => resetMutation.mutate(active.key)}
                  disabled={resetMutation.isPending}
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                className="rounded-xl gap-1"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="size-3.5" />
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-title">Display title</Label>
            <input
              id="tpl-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            />
          </div>

          <TextAreaField
            label="Message"
            value={draft.message}
            onChange={(v) => setDraft((d) => ({ ...d, message: v }))}
          />

          {active.variables.length > 0 && (
            <div className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Available variables
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {active.variables.map((v) => `{{${v}}}`).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
