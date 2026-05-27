"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Mail,
  Package,
  Phone,
  Plus,
  ShoppingCart,
  Truck,
  Upload,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/layout/stat-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
};

type PO = {
  id: string;
  status: string;
  totalAmount: number;
  supplier: { name: string };
};

type Product = { id: string; name: string; costPrice: number };

function ContactRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof Phone;
  value: string | null;
  href?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0 opacity-50" />
        <span>—</span>
      </div>
    );
  }

  const content = (
    <>
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="truncate">{value}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-2 text-sm">{content}</div>;
}

function SupplierAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-bold text-white shadow-sm">
      {initial}
    </span>
  );
}

function PurchaseStatusBadge({ status }: { status: string }) {
  const received = status === "RECEIVED";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "mt-2 rounded-full px-2.5 py-1 text-xs capitalize lg:mt-0",
        received
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800",
      )}
    >
      {status.toLowerCase()}
    </Badge>
  );
}

export function SuppliersList() {
  const queryClient = useQueryClient();
  const { formatMoney } = useBusinessSettings();
  const [poOpen, setPoOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [supplierPage, setSupplierPage] = useState(1);
  const [poPage, setPoPage] = useState(1);

  const { data: allSuppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return parseApiResponse<Supplier[]>(res);
    },
  });

  const { data: supplierData, isLoading } = useQuery({
    queryKey: ["suppliers", "paginated", supplierPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(supplierPage),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/suppliers?${params}`);
      return parseApiResponse<Paginated<Supplier>>(res);
    },
  });

  const suppliers = supplierData?.items ?? [];
  const supplierTotal = supplierData?.total ?? 0;

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return parseApiResponse<Product[]>(res);
    },
  });

  const { data: poData } = useQuery({
    queryKey: ["purchase-orders", "paginated", poPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(poPage),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/purchase-orders?${params}`);
      return parseApiResponse<Paginated<PO>>(res);
    },
  });

  const purchaseOrders = poData?.items ?? [];
  const poTotal = poData?.total ?? 0;

  const { data: allPurchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders");
      return parseApiResponse<PO[]>(res);
    },
  });

  const createPO = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: [{ productId, quantityOrdered: qty, unitCost }],
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
      setPoOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const receivePO = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: "POST",
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock received");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openPOs = allPurchaseOrders.filter((po) => po.status !== "RECEIVED").length;

  return (
    <PageShell size="wide" className="pb-10">
      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-brand-cream via-white to-orange-100/70 p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-soft">
              <Truck className="size-6" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Procurement
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Suppliers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Manage vendor contacts, create purchase orders, and track incoming
                stock from one clean supplier workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/suppliers/import"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-xl bg-white/80 touch-manipulation",
              })}
            >
              <Upload className="size-4" />
              Import
            </Link>
            <Link
              href="/dashboard/suppliers/new"
              className={buttonVariants({ className: "rounded-xl touch-manipulation" })}
            >
              <Plus className="size-4" />
              Add supplier
            </Link>
            <Dialog open={poOpen} onOpenChange={setPoOpen}>
              <DialogTrigger
                disabled={allSuppliers.length === 0}
                className={buttonVariants({
                  variant: "outline",
                  className: "rounded-xl bg-white/80",
                })}
              >
                <ShoppingCart className="size-4" />
                Create PO
              </DialogTrigger>
              <DialogContent className="border-primary/10 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create purchase order</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select
                      value={supplierId}
                      onValueChange={(v) => setSupplierId(v ?? "")}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-gray-200 bg-white">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSuppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select
                      value={productId}
                      onValueChange={(v) => {
                        const id = v ?? "";
                        setProductId(id);
                        const p = products.find((x) => x.id === id);
                        if (p) setUnitCost(p.costPrice);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl border-gray-200 bg-white">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit cost</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={unitCost}
                        onChange={(e) => setUnitCost(Number(e.target.value))}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    className="h-11 w-full rounded-xl"
                    onClick={() => createPO.mutate()}
                    disabled={!supplierId || !productId || createPO.isPending}
                  >
                    Create order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Suppliers"
          value={String(supplierTotal)}
          icon={Truck}
          highlight
        />
        <StatCard
          label="Purchase orders"
          value={String(poTotal)}
          sub={`${openPOs} open`}
          icon={Package}
          accent="blue"
        />
        <StatCard
          label="Products"
          value={String(products.length)}
          sub="Available for PO lines"
          icon={ShoppingCart}
          className="sm:col-span-2 lg:col-span-1"
        />
      </section>

      <Card className="border-primary/10 shadow-soft">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white via-brand-cream/60 to-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Supplier directory</CardTitle>
              <CardDescription>Contacts for ordering and restocking</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full bg-orange-100 text-orange-800">
              {supplierTotal} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : suppliers.length === 0 && supplierTotal === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers yet"
              message="Add your first supplier to create purchase orders and track stock."
              action={
                <Link href="/dashboard/suppliers/new" className={buttonVariants()}>
                  <Plus className="size-4" />
                  Add supplier
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-brand-cream/30 p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <SupplierAvatar name={s.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.contact || "No contact person"}
                        </p>
                      </div>
                    </div>
                    {s.contact && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="size-4 shrink-0" />
                        {s.contact}
                      </div>
                    )}
                    <div className="mt-2 space-y-1.5">
                      <ContactRow
                        icon={Phone}
                        value={s.phone}
                        href={s.phone ? `tel:${s.phone}` : undefined}
                      />
                      <ContactRow
                        icon={Mail}
                        value={s.email}
                        href={s.email ? `mailto:${s.email}` : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-gray-100 lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <SupplierAvatar name={s.name} />
                            <div>
                              <p className="font-semibold">{s.name}</p>
                              <p className="text-xs text-muted-foreground">Vendor profile</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{s.contact ?? "—"}</TableCell>
                        <TableCell>
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
                              <Phone className="size-3.5" />
                              {s.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {s.email ? (
                            <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
                              <Mail className="size-3.5" />
                              {s.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={supplierPage}
                pageSize={PAGE_SIZE}
                total={supplierTotal}
                onPageChange={setSupplierPage}
                itemName="suppliers"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-soft">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white via-blue-50/80 to-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Purchase orders</CardTitle>
              <CardDescription>Track incoming stock from suppliers</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-800">
              {openPOs} open
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {poTotal === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              message="No purchase orders yet. Create one when you need to restock."
            />
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {purchaseOrders.map((po) => (
                  <div
                    key={po.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{po.supplier.name}</p>
                        <PurchaseStatusBadge status={po.status} />
                      </div>
                      <p className="font-semibold tabular-nums">
                        {formatMoney(po.totalAmount)}
                      </p>
                    </div>
                    {po.status !== "RECEIVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full rounded-xl"
                        onClick={() => receivePO.mutate(po.id)}
                        disabled={receivePO.isPending}
                      >
                        Receive stock
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-gray-100 lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-semibold">{po.supplier.name}</TableCell>
                        <TableCell>
                          <PurchaseStatusBadge status={po.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(po.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {po.status !== "RECEIVED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => receivePO.mutate(po.id)}
                              disabled={receivePO.isPending}
                            >
                              Receive stock
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                page={poPage}
                pageSize={PAGE_SIZE}
                total={poTotal}
                onPageChange={setPoPage}
                itemName="orders"
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
