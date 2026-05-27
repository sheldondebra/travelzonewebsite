"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { looksLikeSqlDump } from "@/lib/import/detect-garbage";
import { IMPORT_TEMPLATE, parseCsv } from "@/lib/csv-parse";
import Link from "next/link";

type ImportResult = {
  imported: number;
  failed: number;
  results: { name: string; ok: boolean; error?: string }[];
};

export function ImportProducts() {
  const [preview, setPreview] = useState<
    {
      name: string;
      sku?: string;
      barcode?: string;
      price: number;
      costPrice: number;
      stockQuantity: number;
      category?: string;
      subCategory?: string;
      brand?: string;
      unit?: string;
    }[]
  >([]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/products/import", {
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
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".sql")) {
      toast.error(
        "Use Database import for .sql files (Products → Database import), not CSV import.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (looksLikeSqlDump(text)) {
        toast.error(
          "This file is a MySQL dump, not a CSV. Open Database import to load novasori_novaosp.sql.",
        );
        return;
      }
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast.error("CSV needs a header row and at least one product");
        return;
      }
      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""));
      const idx = (key: string) => headers.indexOf(key);

      const parsed = rows
        .slice(1)
        .filter((r) => r[0])
        .filter((r) => !/^\(\d+$/.test(String(r[0]).trim()))
        .map((row) => ({
        name: row[idx("name")] ?? row[0],
        sku: row[idx("sku")] || undefined,
        barcode: row[idx("barcode")] || undefined,
        price: Number(row[idx("price")] || 0),
        costPrice: Number(row[idx("costprice")] || row[idx("cost")] || 0),
        stockQuantity: Number(
          row[idx("stock")] || row[idx("stockquantity")] || 0,
        ),
        category: row[idx("category")] || undefined,
        subCategory: row[idx("subcategory")] || undefined,
        brand: row[idx("brand")] || undefined,
        unit: row[idx("unit")] || undefined,
      }));

      setPreview(parsed);
      toast.success(`${parsed.length} rows ready to import`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Import products</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to bulk-create products with opening stock. For a
          legacy MySQL dump (.sql), use{" "}
          <Link
            href="/dashboard/products/database-import"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Database import
          </Link>{" "}
          instead — do not upload .sql here.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-primary/30 bg-brand-rose/20 p-8">
        <Label
          htmlFor="csv"
          className="flex cursor-pointer flex-col items-center gap-3"
        >
          <Upload className="size-10 text-primary" strokeWidth={1.5} />
          <span className="font-medium">Drop CSV or click to upload</span>
          <span className="text-sm text-muted-foreground">
            Columns: name, sku, barcode, price, costPrice, stock, category,
            subCategory, brand, unit
          </span>
        </Label>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      <Button
        variant="outline"
        onClick={() => {
          const blob = new Blob([IMPORT_TEMPLATE], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "product-import-template.csv";
          a.click();
        }}
      >
        <Download className="mr-2 size-4" />
        Download template
      </Button>

      {preview.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <p className="font-medium">{preview.length} products ready</p>
          <div className="max-h-64 overflow-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.price}</td>
                    <td className="py-2">{r.stockQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <p className="mt-2 text-muted-foreground">
                +{preview.length - 10} more
              </p>
            )}
          </div>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? "Importing..." : "Import all"}
          </Button>
        </div>
      )}
    </div>
  );
}
