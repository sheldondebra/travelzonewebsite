"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Truck,
  Upload,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { parseCsv } from "@/lib/csv-parse";

const TEMPLATE = `name,contact,phone,email,notes
Accra Wholesale,Kofi,0244111222,orders@wholesale.com,Net 30
Kumasi Supplies,Ama,0555333444,,`;

type ImportResult = {
  imported: number;
  failed: number;
  results: { name: string; ok: boolean; error?: string }[];
};

export function ImportSuppliers() {
  const [preview, setPreview] = useState<
    {
      name: string;
      contact?: string;
      phone?: string;
      email?: string;
      notes?: string;
    }[]
  >([]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/suppliers/import", {
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
        toast.error("CSV needs a header row and at least one supplier");
        return;
      }
      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""));
      const idx = (key: string) => headers.indexOf(key);
      const parsed = rows.slice(1).filter((r) => r[0]).map((row) => ({
        name: row[idx("name")] ?? row[0],
        contact: row[idx("contact")] || undefined,
        phone: row[idx("phone")] || undefined,
        email: row[idx("email")] || undefined,
        notes: row[idx("notes")] || undefined,
      }));
      setPreview(parsed);
      toast.success(`${parsed.length} rows ready to import`);
    };
    reader.readAsText(file);
  }

  return (
    <PageShell size="wide" className="pb-10">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-cream via-white to-orange-100/70 p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-soft">
              <FileSpreadsheet className="size-6" strokeWidth={1.8} />
            </span>
            <div>
              <Link
                href="/dashboard/suppliers"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Suppliers
              </Link>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Import suppliers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Upload a CSV file to add multiple vendors at once. Use the template
                so names, contacts, phone numbers, emails, and notes import cleanly.
              </p>
            </div>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
            download="suppliers-template.csv"
            className={buttonVariants({
              variant: "outline",
              className: "w-fit rounded-xl bg-white/80",
            })}
          >
            <Download className="size-4" />
            Download template
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-primary/10 shadow-soft">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white via-brand-cream/60 to-white px-5 py-4">
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Required column: name. Optional columns: contact, phone, email, notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="rounded-3xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-brand-cream/50 to-white p-8">
              <Label
                htmlFor="csv-suppliers"
                className="flex cursor-pointer flex-col items-center gap-3 text-center"
              >
                <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/15 text-primary">
                  <Upload className="size-8" strokeWidth={1.6} />
                </span>
                <span className="text-base font-semibold">
                  Drop CSV or click to upload
                </span>
                <span className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  The importer will preview the supplier rows before saving them.
                </span>
                <input
                  id="csv-suppliers"
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

            {preview.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="font-semibold">Preview</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.length} supplier rows ready
                    </p>
                  </div>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="rounded-xl"
                  >
                    <CheckCircle2 className="size-4" />
                    {importMutation.isPending
                      ? "Importing..."
                      : `Import ${preview.length}`}
                  </Button>
                </div>
                <div className="divide-y divide-gray-100">
                  {preview.slice(0, 8).map((row, index) => (
                    <div
                      key={`${row.name}-${index}`}
                      className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[1fr_1fr_1fr]"
                    >
                      <span className="font-medium">{row.name}</span>
                      <span className="text-muted-foreground">
                        {row.contact || row.phone || "No contact"}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {row.email || row.notes || "No email/notes"}
                      </span>
                    </div>
                  ))}
                  {preview.length > 8 && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      +{preview.length - 8} more rows
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/80 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-5 text-orange-600" />
                CSV tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Use one supplier per row and keep the header row unchanged.</p>
              <p>Phone and email are optional, but they make purchase orders easier.</p>
              <p>Notes are useful for payment terms, minimum order quantity, and delivery days.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
