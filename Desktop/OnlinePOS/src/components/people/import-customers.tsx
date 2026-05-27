"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { parseCsv } from "@/lib/csv-parse";

const TEMPLATE = `name,phone,email,tags
Jane Doe,0244123456,jane@example.com,VIP
John Mensah,0555987654,,Frequent Buyer`;

type ImportResult = {
  imported: number;
  failed: number;
  results: { name: string; ok: boolean; error?: string }[];
};

export function ImportCustomers() {
  const [preview, setPreview] = useState<
    { name: string; phone?: string; email?: string; tags?: string }[]
  >([]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview }),
      });
      return parseApiResponse<ImportResult>(res);
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported}, failed ${data.failed}`);
      if (data.failed === 0) setPreview([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast.error("CSV needs a header row and at least one customer");
        return;
      }
      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""));
      const idx = (key: string) => headers.indexOf(key);
      const parsed = rows.slice(1).filter((r) => r[0]).map((row) => ({
        name: row[idx("name")] ?? row[0],
        phone: row[idx("phone")] || undefined,
        email: row[idx("email")] || undefined,
        tags: row[idx("tags")] || undefined,
      }));
      setPreview(parsed);
      toast.success(`${parsed.length} rows ready to import`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Import customers</h1>
        <p className="text-muted-foreground">
          Bulk import customers without portal login (use Create customer for login)
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-primary/30 bg-brand-rose/20 p-8">
        <Label htmlFor="csv" className="flex cursor-pointer flex-col items-center gap-3">
          <Upload className="size-10 text-primary" strokeWidth={1.5} />
          <span className="font-medium">Drop CSV or click to upload</span>
          <span className="text-sm text-muted-foreground">
            Columns: name, phone, email, tags (semicolon-separated)
          </span>
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </Label>
      </div>

      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
        download="customers-template.csv"
        className={buttonVariants({ variant: "outline" })}
      >
        <Download className="mr-2 size-4" />
        Download template
      </a>

      {preview.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-medium">{preview.length} customers ready</p>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
          >
            Import {preview.length} customers
          </Button>
        </div>
      )}
    </div>
  );
}
