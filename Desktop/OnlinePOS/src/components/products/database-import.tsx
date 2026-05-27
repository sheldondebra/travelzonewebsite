"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Database,
  CheckCircle2,
  AlertTriangle,
  Circle,
  ArrowRight,
  Package,
  Users,
  Receipt,
  Settings2,
  History,
  Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";
import { DUMP_FILE_HINTS } from "@/lib/import/coverage-domains";
import {
  FULL_IMPORT_TABLES,
  IMPORT_UI_TABLES,
  REQUIRED_IMPORT_TABLES,
} from "@/lib/import/mysql-dump-parser";
import type { ImportCoverageSnapshot } from "@/server/services/import/get-import-coverage";
import { cn } from "@/lib/utils";

type TableSummary = Record<
  string,
  { rowCount: number; columns: string[] | null; warnings: string[] }
>;

type UploadResult = {
  sessionId: string;
  fileName: string;
  fileSize: number;
  tableCount: number;
  tableSummary: TableSummary;
};

type ImportResult = {
  success: number;
  failed: number;
  skipped: number;
  warnings: number;
  byTable: Record<string, { success: number; failed: number; skipped: number }>;
};

const DOMAIN_ICONS: Record<string, typeof Package> = {
  catalog: Package,
  customers: Users,
  sales: Receipt,
  settings: Settings2,
  adjustments: History,
  planned: Clock,
};

function statusBadge(status: string) {
  switch (status) {
    case "complete":
      return (
        <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
          Complete
        </Badge>
      );
    case "partial":
      return (
        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
          Partial
        </Badge>
      );
    case "planned":
      return <Badge variant="secondary">Planned</Badge>;
    case "empty":
      return <Badge variant="outline">Empty in dump</Badge>;
    default:
      return <Badge variant="outline">Not imported</Badge>;
  }
}

export function DatabaseImport() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"overview" | "wizard">("overview");
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tableSummary, setTableSummary] = useState<TableSummary | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [mode, setMode] = useState<
    "products_only" | "products_and_stock" | "full" | "sales_history"
  >("full");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [stopOnError, setStopOnError] = useState(false);
  const [progress, setProgress] = useState("");

  const { data: coverage, isLoading: coverageLoading } = useQuery({
    queryKey: ["import-coverage"],
    queryFn: async () => {
      const res = await fetch("/api/import/coverage");
      return parseApiResponse<ImportCoverageSnapshot>(res);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import/upload", {
        method: "POST",
        body: form,
      });
      return parseApiResponse<UploadResult>(res);
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setTableSummary(data.tableSummary);
      setStep(2);
      setView("wizard");
      toast.success("SQL file analyzed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bundledMutation = useMutation({
    mutationFn: async () => {
      setProgress("Running full import from novasori_novaosp.sql…");
      const res = await fetch("/api/import/bundled", { method: "POST" });
      return parseApiResponse<{
        sessionId: string;
        tableSummary: TableSummary;
        result: ImportResult;
      }>(res);
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setTableSummary(data.tableSummary);
      setImportResult(data.result);
      setStep(4);
      setView("wizard");
      setProgress("");
      queryClient.invalidateQueries({ queryKey: ["import-coverage"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success(`Imported ${data.result.success} records`);
    },
    onError: (e: Error) => {
      setProgress("");
      toast.error(e.message);
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      setProgress("Starting import...");
      const res = await fetch("/api/import/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode,
          updateExisting,
          skipDuplicates,
          stopOnError,
        }),
      });
      return parseApiResponse<ImportResult>(res);
    },
    onSuccess: (data) => {
      setImportResult(data);
      setStep(4);
      setProgress("Import completed");
      queryClient.invalidateQueries({ queryKey: ["import-coverage"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Imported ${data.success} records`);
    },
    onError: (e: Error) => {
      setProgress("");
      toast.error(e.message);
    },
  });

  const { data: failedLogs } = useQuery({
    queryKey: ["import-logs", sessionId, "FAILED"],
    queryFn: async () => {
      const res = await fetch(
        `/api/import/logs?sessionId=${sessionId}&status=FAILED`,
      );
      const data = await parseApiResponse<{
        logs: { tableName: string; message: string | null }[];
      }>(res);
      return data.logs;
    },
    enabled: !!sessionId && step === 4,
  });

  function handleFile(file: File) {
    uploadMutation.mutate(file);
  }

  function downloadErrors() {
    if (!sessionId) return;
    window.open(`/api/import/errors/download?sessionId=${sessionId}`, "_blank");
  }

  const missingRequired =
    tableSummary &&
    REQUIRED_IMPORT_TABLES.filter(
      (t) => (tableSummary[t]?.rowCount ?? 0) === 0,
    );

  const recommendedMode = coverage?.summary.recommendedMode ?? "full";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Legacy database migration
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Import from <code className="text-sm">novasori_novaosp.sql</code> — products,
            stock, customers, sales (GHS 53,605 active total), settings, and adjustment
            history. Never upload the <code className="text-sm">.sql</code> file on the CSV
            import page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("overview")}
          >
            Overview
          </Button>
          <Button
            variant={view === "wizard" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("wizard")}
          >
            Import wizard
          </Button>
        </div>
      </div>

      {view === "overview" && (
        <div className="space-y-6">
          {coverageLoading && (
            <p className="text-sm text-muted-foreground">Analyzing dump and database…</p>
          )}

          {coverage && (
            <>
              <Card
                className={cn(
                  "border-2 shadow-soft",
                  coverage.summary.catalogComplete && coverage.summary.salesComplete
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-primary/20 bg-brand-rose/10",
                )}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {coverage.summary.catalogComplete &&
                    coverage.summary.salesComplete ? (
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-600" />
                    )}
                    Migration status
                  </CardTitle>
                  <CardDescription>{coverage.summary.message}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/products"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Package className="mr-2 size-4" />
                    {coverage.appTotals.products} products
                  </Link>
                  <Link
                    href="/dashboard/people"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Users className="mr-2 size-4" />
                    {coverage.appTotals.customers} customers
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Receipt className="mr-2 size-4" />
                    {coverage.appTotals.orders} orders
                  </Link>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {coverage.domains.map((domain) => {
                  const Icon = DOMAIN_ICONS[domain.id] ?? Database;
                  return (
                    <Card key={domain.id} className="shadow-soft">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="size-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{domain.title}</CardTitle>
                              <CardDescription className="text-xs">
                                {domain.description}
                              </CardDescription>
                            </div>
                          </div>
                          {statusBadge(domain.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5 text-sm">
                          {domain.tables.map((row) => (
                            <li
                              key={row.key}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
                            >
                              <span className="flex items-center gap-2 text-muted-foreground">
                                {row.status === "complete" ? (
                                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                                ) : row.status === "planned" ? (
                                  <Clock className="size-3.5" />
                                ) : (
                                  <Circle className="size-3.5" />
                                )}
                                {row.label}
                              </span>
                              <span className="tabular-nums text-xs font-medium">
                                {row.appRows != null
                                  ? `${row.appRows} / ${row.dumpRows}`
                                  : row.dumpRows > 0
                                    ? `${row.dumpRows} in dump`
                                    : "—"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Quick actions</CardTitle>
                  <CardDescription>
                    {coverage.dumpFileFound
                      ? `Using ${coverage.dumpFilePath}`
                      : `Place the dump at ${DUMP_FILE_HINTS.join(" or ")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    size="lg"
                    disabled={bundledMutation.isPending || !coverage.dumpFileFound}
                    onClick={() => bundledMutation.mutate()}
                  >
                    <Database className="mr-2 size-4" />
                    {bundledMutation.isPending
                      ? "Importing…"
                      : "Re-run full import (bundled SQL)"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setMode(
                        recommendedMode === "sales_history"
                          ? "sales_history"
                          : "full",
                      );
                      setView("wizard");
                      setStep(1);
                    }}
                  >
                    Upload different .sql file
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </CardContent>
                {progress && (
                  <p className="px-6 pb-4 text-sm text-muted-foreground">{progress}</p>
                )}
              </Card>

              <p className="text-xs text-muted-foreground">
                Legacy tables not migrated: HR, accounting, WooCommerce logs, translations
                (43k rows), and empty purchase/expense tables. Product images should live in{" "}
                <code>public/products</code>.
              </p>
            </>
          )}
        </div>
      )}

      {view === "wizard" && (
        <>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  s <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>

          {step === 1 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="size-5" />
                  Upload SQL dump
                </CardTitle>
                <CardDescription>
                  phpMyAdmin export · max 15MB · use <strong>Full import</strong> for
                  customers and sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label
                  htmlFor="sql-file"
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-brand-rose/20 p-10"
                >
                  <Database className="size-12 text-primary" strokeWidth={1.5} />
                  <span className="font-medium">Drop .sql file or click to upload</span>
                  <input
                    id="sql-file"
                    type="file"
                    accept=".sql"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </Label>
                <div className="mt-4 border-t pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={bundledMutation.isPending || uploadMutation.isPending}
                    onClick={() => bundledMutation.mutate()}
                  >
                    {bundledMutation.isPending
                      ? "Importing bundled dump…"
                      : "Import bundled novasori_novaosp.sql (full)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && tableSummary && (
            <div className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Detected tables</CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 space-y-2 overflow-auto">
                  {Object.entries(tableSummary)
                    .filter(([table]) =>
                      (
                        [...IMPORT_UI_TABLES, ...FULL_IMPORT_TABLES] as string[]
                      ).includes(table),
                    )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([table, info]) => (
                      <div
                        key={table}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{table}</span>
                        <span className="text-muted-foreground">
                          {info.rowCount} rows
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
              {missingRequired && missingRequired.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6 text-sm text-amber-900">
                    Missing: {missingRequired.join(", ")}
                  </CardContent>
                </Card>
              )}
              <Button className="w-full" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          )}

          {step === 3 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Import options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    ["products_only", "Products only"],
                    ["products_and_stock", "Products + stock"],
                    ["full", "Full (catalog + customers + sales + settings)"],
                    ["sales_history", "Sales history only (keeps catalog)"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === value}
                      onChange={() => setMode(value)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => {
                      setUpdateExisting(e.target.checked);
                      if (e.target.checked) setSkipDuplicates(false);
                    }}
                  />
                  Update existing by legacy ID
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    disabled={updateExisting}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  Skip duplicates
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={runMutation.isPending || !sessionId}
                    onClick={() => runMutation.mutate()}
                  >
                    {runMutation.isPending ? "Importing…" : "Run import"}
                  </Button>
                </div>
                {progress && (
                  <p className="text-sm text-muted-foreground">{progress}</p>
                )}
              </CardContent>
            </Card>
          )}

          {step === 4 && importResult && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-600" />
                  Import result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Success" value={importResult.success} />
                  <Stat label="Failed" value={importResult.failed} />
                  <Stat label="Skipped" value={importResult.skipped} />
                  <Stat label="Warnings" value={importResult.warnings} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/dashboard/products" className={buttonVariants()}>
                    View products
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    View orders
                  </Link>
                  <Button variant="outline" onClick={() => setView("overview")}>
                    Back to overview
                  </Button>
                  {importResult.failed > 0 && (
                    <Button variant="outline" onClick={downloadErrors}>
                      <Download className="mr-2 size-4" />
                      Error report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
