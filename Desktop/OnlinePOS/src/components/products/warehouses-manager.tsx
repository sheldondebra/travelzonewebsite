"use client";

import { useQuery } from "@tanstack/react-query";
import { Warehouse } from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

type WarehouseRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  isActive: boolean;
  oldId: string | null;
};

export function WarehousesManager() {
  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses");
      return parseApiResponse<WarehouseRow[]>(res);
    },
  });

  const {
    page,
    setPage,
    items,
    total,
    pageSize,
  } = useClientPagination(warehouses);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Warehouses</h1>
        <p className="text-muted-foreground">
          Stock locations from your legacy database import
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
        {isLoading ? (
          <p className="p-8 text-sm text-muted-foreground">Loading…</p>
        ) : warehouses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Warehouse className="size-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-muted-foreground">No warehouses yet.</p>
            <p className="text-sm text-muted-foreground">
              Run a database import to bring warehouses from your old system.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Legacy ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">
                      {w.name}
                      {w.isDefault && (
                        <Badge className="ml-2" variant="secondary">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[w.city, w.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.phone ?? w.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {w.oldId ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={w.isActive ? "default" : "outline"}>
                        {w.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              itemName="warehouses"
            />
          </>
        )}
      </div>
    </div>
  );
}
