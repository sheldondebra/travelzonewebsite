"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { ProductVariantsEditor } from "@/components/products/product-variants-editor";
import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { Badge } from "@/components/ui/badge";
import type {
  CatalogItem,
  ProductRow,
  SubCategoryItem,
} from "@/components/products/product-types";

type ProductFormProps = {
  productId?: string;
};

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!productId;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    price: "",
    costPrice: "",
    wholesalePrice: "",
    minimumPrice: "",
    compareAtPrice: "",
    stockQuantity: "0",
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    unitId: "",
    imageUrl: "",
    isPublic: true,
  });

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      return parseApiResponse<ProductRow>(res);
    },
    enabled: isEdit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ["sub-categories", form.categoryId],
    queryFn: async () => {
      const q = form.categoryId ? `?categoryId=${form.categoryId}` : "";
      const res = await fetch(`/api/catalog/sub-categories${q}`);
      return parseApiResponse<SubCategoryItem[]>(res);
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/brands");
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/units");
      return parseApiResponse<
        (CatalogItem & { abbreviation: string | null })[]
      >(res);
    },
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? "",
        barcode: product.barcode ?? "",
        description: product.description ?? "",
        price: String(product.price),
        costPrice: String(product.costPrice),
        wholesalePrice: String(product.wholesalePrice ?? 0),
        minimumPrice: String(product.minimumPrice ?? 0),
        compareAtPrice: product.compareAtPrice
          ? String(product.compareAtPrice)
          : "",
        stockQuantity: String(product.stockQuantity),
        categoryId: product.categoryId ?? "",
        subCategoryId: product.subCategoryId ?? "",
        brandId: product.brandId ?? "",
        unitId: product.unitId ?? "",
        imageUrl: product.imageUrl ?? "",
        isPublic: product.isPublic,
      });
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        description: form.description || undefined,
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        wholesalePrice: Number(form.wholesalePrice || 0),
        minimumPrice: Number(form.minimumPrice || 0),
        compareAtPrice: form.compareAtPrice
          ? Number(form.compareAtPrice)
          : undefined,
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId || undefined,
        subCategoryId: form.subCategoryId || undefined,
        brandId: form.brandId || undefined,
        unitId: form.unitId || undefined,
        imageUrl: form.imageUrl || undefined,
        isPublic: form.isPublic,
      };

      const res = await fetch(
        isEdit ? `/api/products/${productId}` : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      return parseApiResponse<ProductRow>(res);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success(isEdit ? "Product updated" : "Product created");
      router.push(
        isEdit && productId
          ? `/dashboard/products/${productId}`
          : `/dashboard/products/${saved.id}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEdit ? "Edit product" : "Create product"}
          </h1>
          <p className="text-muted-foreground">
            Add details, pricing, and catalog classification
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && productId && (
            <Link
              href={`/dashboard/products/${productId}`}
              className={buttonVariants({ variant: "outline" })}
            >
              View product
            </Link>
          )}
          <Link
            href="/dashboard/products"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to list
          </Link>
        </div>
      </div>

      <form
        className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Product name *</Label>
            <Input
              placeholder="e.g. Yellow summer dress"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="SKU-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Barcode</Label>
            <Input
              placeholder="Scan or type barcode"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  categoryId: v ?? "",
                  subCategoryId: "",
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
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
          <div className="space-y-2">
            <Label>Sub category</Label>
            <Select
              value={form.subCategoryId}
              onValueChange={(v) =>
                setForm({ ...form, subCategoryId: v ?? "" })
              }
              disabled={!form.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {subCategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              value={form.brandId}
              onValueChange={(v) => setForm({ ...form, brandId: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={form.unitId}
              onValueChange={(v) => setForm({ ...form, unitId: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.abbreviation ? ` (${u.abbreviation})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>
              Selling price *
              {product?.productType === "VARIABLE" && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (parent — use variants)
                </span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
                placeholder="0.00"
                value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              disabled={product?.productType === "VARIABLE"}
            />
          </div>
          <div className="space-y-2">
            <Label>Cost price *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              required
              disabled={product?.productType === "VARIABLE"}
            />
          </div>
          <div className="space-y-2">
            <Label>Wholesale</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.wholesalePrice}
              onChange={(e) =>
                setForm({ ...form, wholesalePrice: e.target.value })
              }
              disabled={product?.productType === "VARIABLE"}
            />
          </div>
          <div className="space-y-2">
            <Label>Minimum price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.minimumPrice}
              onChange={(e) =>
                setForm({ ...form, minimumPrice: e.target.value })
              }
              disabled={product?.productType === "VARIABLE"}
            />
          </div>
          <div className="space-y-2">
            <Label>Compare at price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.compareAtPrice}
              onChange={(e) =>
                setForm({ ...form, compareAtPrice: e.target.value })
              }
            />
          </div>
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label>Opening stock</Label>
            <Input
              type="number"
              min={0}
              value={form.stockQuantity}
              onChange={(e) =>
                setForm({ ...form, stockQuantity: e.target.value })
              }
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Image</Label>
          <div className="flex flex-wrap items-start gap-4">
            <ProductThumbnail
              imageUrl={form.imageUrl || product?.imageUrl}
              name={form.name || "Product"}
              className="size-20"
            />
            <div className="min-w-[240px] flex-1 space-y-1">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="/products/filename.jpg or https://..."
              />
              <p className="text-xs text-muted-foreground">
                Legacy imports use paths like /products/your-file.jpeg in{" "}
                <code className="rounded bg-muted px-1">public/products</code>
              </p>
            </div>
          </div>
        </div>

        {isEdit && product?.productType === "VARIABLE" && productId && (
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Variants</h2>
              <Badge variant="secondary">Variable product</Badge>
            </div>
            <ProductVariantsEditor
              productId={productId}
              productName={product.name}
            />
          </div>
        )}

        {isEdit && product?.productType === "VARIABLE" && (
          <p className="text-sm text-muted-foreground">
            Parent selling price is derived from variants. Adjust prices from the
            product list or bulk pricing.
          </p>
        )}

        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="Short description for staff or storefront"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            className="size-4 rounded"
          />
          Visible on public storefront
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
          {isEdit && productId ? (
            <>
              <Link
                href={`/dashboard/products/${productId}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Cancel
              </Link>
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </>
          ) : (
            <Link
              href="/dashboard/products"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Link>
          )}
        </div>
      </form>

      {isEdit && productId && product && (
        <ProductDeleteDialog
          productId={productId}
          productName={product.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}
