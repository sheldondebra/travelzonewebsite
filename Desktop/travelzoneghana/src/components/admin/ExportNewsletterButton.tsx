"use client";

import { useState, useTransition } from "react";
import { exportNewsletterCsvAction } from "@/app/admin/actions/newsletter";

export function ExportNewsletterButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const csv = await exportNewsletterCsvAction();
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Export failed.");
            }
          });
        }}
        className="admin-button-primary"
      >
        {pending ? "Exporting…" : "Export CSV"}
      </button>
      {error ? <p className="mt-2 text-[13px] text-[#d63638]">{error}</p> : null}
    </div>
  );
}
