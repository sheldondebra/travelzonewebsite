"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiResponse } from "@/lib/api-client";
import type { CatalogItem, SubCategoryItem } from "@/components/products/product-types";

type CatalogManagerProps = {
  title: string;
  description: string;
  type: "categories" | "sub-categories" | "brands" | "units";
};

const endpoints = {
  categories: "/api/catalog/categories",
  "sub-categories": "/api/catalog/sub-categories",
  brands: "/api/catalog/brands",
  units: "/api/catalog/units",
};

export function CatalogManager({ title, description, type }: CatalogManagerProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const endpoint = endpoints[type];

  const { data: items = [], isLoading } = useQuery({
    queryKey: [type],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (type === "sub-categories") {
        return parseApiResponse<SubCategoryItem[]>(res);
      }
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<CatalogItem[]>(res);
    },
    enabled: type === "sub-categories",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { name };
      if (type === "units" && abbreviation) body.abbreviation = abbreviation;
      if (type === "sub-categories") body.categoryId = categoryId;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
      setName("");
      setAbbreviation("");
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-end gap-3">
          {type === "sub-categories" && (
            <div className="min-w-[180px] flex-1 space-y-2">
              <Label>Parent category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="min-w-[180px] flex-1 space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`New ${title.toLowerCase()}`}
            />
          </div>
          {type === "units" && (
            <div className="w-28 space-y-2">
              <Label>Abbr.</Label>
              <Input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="pcs"
              />
            </div>
          )}
          <Button
            onClick={() => createMutation.mutate()}
            disabled={
              !name.trim() ||
              (type === "sub-categories" && !categoryId) ||
              createMutation.isPending
            }
          >
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-soft">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No items yet</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const sub =
                type === "sub-categories" ? (item as SubCategoryItem) : null;
              return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  {sub?.category && (
                    <p className="text-xs text-muted-foreground">
                      {sub.category.name}
                    </p>
                  )}
                  {item._count?.products !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {item._count.products} products
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  Remove
                </Button>
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
