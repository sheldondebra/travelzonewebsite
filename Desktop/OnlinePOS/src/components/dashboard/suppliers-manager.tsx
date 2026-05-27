"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
};

type Product = { id: string; name: string; costPrice: number };

type PO = {
  id: string;
  reference: string | null;
  status: string;
  totalAmount: number;
  supplier: { name: string };
  items: { id: string; quantityOrdered: number; product: { name: string } }[];
};

export function SuppliersManager() {
  const queryClient = useQueryClient();
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [poPage, setPoPage] = useState(1);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      return parseApiResponse<Supplier[]>(res);
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return parseApiResponse<Product[]>(res);
    },
  });

  const { data: poData, isLoading } = useQuery({
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

  const createSupplier = useMutation({
    mutationFn: async (payload: { name: string; phone?: string; email?: string }) => {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse<Supplier>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added");
      setSupplierOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
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
      return parseApiResponse<PO>(res);
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
      return parseApiResponse<PO>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Stock received");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage suppliers and purchase orders for restocking
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
            <DialogTrigger>
              <Button variant="outline">Add supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New supplier</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createSupplier.mutate({
                    name: fd.get("name") as string,
                    phone: (fd.get("phone") as string) || undefined,
                    email: (fd.get("email") as string) || undefined,
                  });
                }}
              >
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" />
                </div>
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={poOpen} onOpenChange={setPoOpen}>
            <DialogTrigger>
              <Button disabled={suppliers.length === 0}>Create PO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select
                    value={supplierId}
                    onValueChange={(v) => setSupplierId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
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
                    <SelectTrigger>
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
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createPO.mutate()}
                  disabled={!supplierId || !productId}
                >
                  Create order
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Purchase orders</h2>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>{po.supplier.name}</TableCell>
                  <TableCell className="capitalize">{po.status.toLowerCase()}</TableCell>
                  <TableCell>{po.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    {po.status !== "RECEIVED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => receivePO.mutate(po.id)}
                      >
                        Receive stock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && poTotal > 0 && (
            <TablePagination
              page={poPage}
              pageSize={PAGE_SIZE}
              total={poTotal}
              onPageChange={setPoPage}
              itemName="orders"
            />
          )}
          </>
        )}
      </div>
    </div>
  );
}
