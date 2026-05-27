"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CircleDollarSign,
  Check,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";
import { validatePricing } from "@/lib/products/pricing";
import { cn } from "@/lib/utils";
import { VariantRowCard } from "@/components/products/variant-row-card";
import { ProductImagePicker } from "@/components/products/product-image-picker";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import {
  generateProductBarcode,
  generateProductSku,
} from "@/lib/products/generate-product-codes";
import type {
  CatalogItem,
  ProductRow,
  SubCategoryItem,
  VariantDraft,
} from "@/components/products/product-types";

const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const PRODUCT_DRAFT_KEY = "onlinepos:new-product-draft:v1";

const EXAMPLE_PRODUCT = {
  name: "Classic White Cotton T-Shirt",
  sku: "TSH-WHT-001",
  barcode: "6001234567890",
  description: "Soft unisex cotton tee. Breathable fabric, regular fit — ideal for everyday wear.",
  costPrice: "45",
  retailPrice: "89",
  wholesalePrice: "70",
  minimumPrice: "75",
  quantity: "24",
  stockAlert: "5",
};

const emptyVariant = (): VariantDraft => ({
  key: crypto.randomUUID(),
  name: "",
  sku: "",
  costPrice: "",
  retailPrice: "",
  wholesalePrice: "",
  minimumPrice: "",
  stockQuantity: "0",
});

type ProductDraft = {
  step: number;
  productType: "SIMPLE" | "VARIABLE";
  basic: {
    name: string;
    sku: string;
    barcode: string;
    description: string;
    categoryId: string;
    subCategoryId: string;
    brandId: string;
    unitId: string;
    imageUrl: string;
  };
  pricing: {
    costPrice: string;
    retailPrice: string;
    wholesalePrice: string;
    minimumPrice: string;
  };
  variants: VariantDraft[];
  stock: {
    quantity: string;
    stockAlert: string;
  };
};

function readProductDraft(): ProductDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PRODUCT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductDraft;
  } catch {
    return null;
  }
}

function writeProductDraft(draft: ProductDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
}

function clearProductDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PRODUCT_DRAFT_KEY);
}

export function ProductWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const draftReadyRef = useRef(false);
  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<"SIMPLE" | "VARIABLE">("SIMPLE");
  const [basic, setBasic] = useState(() => ({
    name: "",
    sku: generateProductSku(),
    barcode: generateProductBarcode(),
    description: "",
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    unitId: "",
    imageUrl: "",
  }));
  const [pricing, setPricing] = useState({
    costPrice: "",
    retailPrice: "",
    wholesalePrice: "",
    minimumPrice: "",
  });
  const [variants, setVariants] = useState<VariantDraft[]>([
    emptyVariant(),
    emptyVariant(),
  ]);
  const [stock, setStock] = useState({
    quantity: "0",
    stockAlert: "5",
  });
  const [draftStatus, setDraftStatus] = useState<"idle" | "saved" | "restored">("idle");

  const steps = useMemo(
    () =>
      productType === "VARIABLE"
        ? [
            { id: 1, label: "Details", icon: Tag },
            { id: 2, label: "Variants & pricing", icon: Layers },
            { id: 3, label: "Review", icon: Check },
          ]
        : [
            { id: 1, label: "Details", icon: Tag },
            { id: 2, label: "Pricing", icon: Sparkles },
            { id: 3, label: "Stock", icon: Package },
            { id: 4, label: "Review", icon: Check },
          ],
    [productType],
  );

  const maxStep = steps.length;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const draft = readProductDraft();
      draftReadyRef.current = true;

      if (!draft) return;
      const draftMaxStep = draft.productType === "VARIABLE" ? 3 : 4;
      setProductType(draft.productType);
      setBasic(draft.basic);
      setPricing(draft.pricing);
      setVariants(draft.variants.length ? draft.variants : [emptyVariant()]);
      setStock(draft.stock);
      setStep(Math.max(1, Math.min(draft.step, draftMaxStep)));
      setDraftStatus("restored");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!draftReadyRef.current) return;

    const timeout = window.setTimeout(() => {
      writeProductDraft({
        step,
        productType,
        basic,
        pricing,
        variants,
        stock,
      });
      setDraftStatus("saved");
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [basic, pricing, productType, step, stock, variants]);

  useEffect(() => {
    if (draftStatus === "idle") return;

    const timeout = window.setTimeout(() => {
      setDraftStatus("idle");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [draftStatus]);

  useEffect(() => {
    if (step <= maxStep) return;

    const timeout = window.setTimeout(() => {
      setStep(maxStep);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [maxStep, step]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ["sub-categories", basic.categoryId],
    queryFn: async () => {
      const q = basic.categoryId ? `?categoryId=${basic.categoryId}` : "";
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
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (addAnother: boolean) => {
      const payload =
        productType === "SIMPLE"
          ? {
              name: basic.name.trim(),
              productType: "SIMPLE" as const,
              sku: basic.sku.trim() || undefined,
              barcode: basic.barcode.trim() || undefined,
              description: basic.description.trim() || undefined,
              categoryId: basic.categoryId || undefined,
              subCategoryId: basic.subCategoryId || undefined,
              brandId: basic.brandId || undefined,
              unitId: basic.unitId || undefined,
              imageUrl: basic.imageUrl.trim() || undefined,
              costPrice: Number(pricing.costPrice),
              price: Number(pricing.retailPrice),
              wholesalePrice: Number(pricing.wholesalePrice || 0),
              minimumPrice: Number(pricing.minimumPrice || 0),
              stockQuantity: Number(stock.quantity || 0),
              stockAlert: Number(stock.stockAlert || 5),
            }
          : {
              name: basic.name.trim(),
              productType: "VARIABLE" as const,
              sku: basic.sku.trim() || undefined,
              barcode: basic.barcode.trim() || undefined,
              description: basic.description.trim() || undefined,
              categoryId: basic.categoryId || undefined,
              subCategoryId: basic.subCategoryId || undefined,
              brandId: basic.brandId || undefined,
              unitId: basic.unitId || undefined,
              imageUrl: basic.imageUrl.trim() || undefined,
              costPrice: 0,
              price: 0,
              stockAlert: Number(stock.stockAlert || 5),
              variants: variants
                .filter((v) => v.name.trim())
                .map((v) => ({
                  name: v.name.trim(),
                  sku: v.sku.trim() || undefined,
                  costPrice: Number(v.costPrice || 0),
                  retailPrice: Number(v.retailPrice),
                  wholesalePrice: Number(v.wholesalePrice || 0),
                  minimumPrice: Number(v.minimumPrice || 0),
                  stockQuantity: Number(v.stockQuantity || 0),
                })),
            };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const product = await parseApiResponse<ProductRow>(res);
      return { addAnother, product };
    },
    onSuccess: ({ addAnother, product }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      clearProductDraft();
      toast.success("Product saved");
      if (addAnother) {
        resetForm();
      } else {
        router.push(`/dashboard/products/${product.id}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function loadExample() {
    setBasic({
      ...basic,
      name: EXAMPLE_PRODUCT.name,
      sku: generateProductSku(EXAMPLE_PRODUCT.name),
      barcode: EXAMPLE_PRODUCT.barcode,
      description: EXAMPLE_PRODUCT.description,
    });
    setPricing({
      costPrice: EXAMPLE_PRODUCT.costPrice,
      retailPrice: EXAMPLE_PRODUCT.retailPrice,
      wholesalePrice: EXAMPLE_PRODUCT.wholesalePrice,
      minimumPrice: EXAMPLE_PRODUCT.minimumPrice,
    });
    setStock({
      quantity: EXAMPLE_PRODUCT.quantity,
      stockAlert: EXAMPLE_PRODUCT.stockAlert,
    });
    toast.message("Example data loaded — adjust or replace before saving");
  }

  function resetForm() {
    draftReadyRef.current = false;
    setStep(1);
    setBasic({
      name: "",
      sku: generateProductSku(),
      barcode: generateProductBarcode(),
      description: "",
      categoryId: "",
      subCategoryId: "",
      brandId: "",
      unitId: "",
      imageUrl: "",
    });
    setPricing({
      costPrice: "",
      retailPrice: "",
      wholesalePrice: "",
      minimumPrice: "",
    });
    setVariants([emptyVariant(), emptyVariant()]);
    setStock({ quantity: "0", stockAlert: "5" });
    clearProductDraft();
    window.setTimeout(() => {
      draftReadyRef.current = true;
    }, 0);
  }

  function filledVariants() {
    return variants.filter((v) => v.name.trim());
  }

  function variantIsValid(v: VariantDraft) {
    if (!v.name.trim() || v.retailPrice === "") return false;
    return (
      validatePricing({
        costPrice: Number(v.costPrice || 0),
        retailPrice: Number(v.retailPrice),
        wholesalePrice: Number(v.wholesalePrice || 0),
        minimumPrice: Number(v.minimumPrice || 0),
      }).errors.length === 0
    );
  }

  function canNext(): boolean {
    if (step === 1) return basic.name.trim().length > 0;
    if (step === 2) {
      if (productType === "SIMPLE") {
        if (pricing.retailPrice === "") return false;
        return (
          validatePricing({
            costPrice: Number(pricing.costPrice || 0),
            retailPrice: Number(pricing.retailPrice),
            wholesalePrice: Number(pricing.wholesalePrice || 0),
            minimumPrice: Number(pricing.minimumPrice || 0),
          }).errors.length === 0
        );
      }
      const filled = filledVariants();
      return filled.length > 0 && filled.every(variantIsValid);
    }
    if (step === 3 && productType === "SIMPLE") return true;
    return true;
  }

  function updateVariant(index: number, next: VariantDraft) {
    setVariants((prev) => prev.map((v, i) => (i === index ? next : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function applyPricingFromFirst() {
    const first = filledVariants()[0];
    if (!first) {
      toast.error("Fill in the first variant before copying prices");
      return;
    }
    setVariants((prev) =>
      prev.map((v) =>
        !v.name.trim()
          ? v
          : {
              ...v,
              costPrice: v.costPrice || first.costPrice,
              retailPrice: v.retailPrice || first.retailPrice,
              wholesalePrice: v.wholesalePrice || first.wholesalePrice,
              minimumPrice: v.minimumPrice || first.minimumPrice,
            },
      ),
    );
    toast.success("Prices copied to empty fields on other variants");
  }

  function addSizePresets() {
    const existing = new Set(
      variants.map((v) => v.name.trim().toUpperCase()).filter(Boolean),
    );
    const toAdd = SIZE_PRESETS.filter((s) => !existing.has(s)).map((name) => ({
      ...emptyVariant(),
      name,
      sku: generateProductSku(name),
    }));
    if (toAdd.length === 0) {
      toast.message("All standard sizes are already added");
      return;
    }
    setVariants((prev) => [...prev, ...toAdd]);
  }

  function refreshSku() {
    setBasic((prev) => ({ ...prev, sku: generateProductSku(prev.name) }));
  }

  function refreshBarcode() {
    setBasic((prev) => ({ ...prev, barcode: generateProductBarcode() }));
  }

  const simplePricingValidation =
    productType === "SIMPLE" && pricing.retailPrice !== ""
      ? validatePricing({
          costPrice: Number(pricing.costPrice || 0),
          retailPrice: Number(pricing.retailPrice),
          wholesalePrice: Number(pricing.wholesalePrice || 0),
          minimumPrice: Number(pricing.minimumPrice || 0),
        })
      : null;

  return (
    <div className="page-container mx-auto w-full max-w-3xl pb-6 lg:max-w-4xl">
      <div className="mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-brand-cream via-white to-brand-rose/35 p-4 shadow-soft sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
            >
              ← Back to products
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Add product
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a clean catalog item with pricing, stock, and product options.
            </p>
            {draftStatus !== "idle" && (
              <p className="text-xs font-medium text-muted-foreground">
                {draftStatus === "restored"
                  ? "Draft restored. You can continue where you stopped."
                  : "Draft saved automatically."}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-primary/20 bg-white/80 text-xs text-foreground shadow-sm hover:bg-brand-rose/40 touch-manipulation"
            onClick={loadExample}
          >
            Try example
          </Button>
        </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Step {step} of {maxStep}</span>
          <span className="text-foreground">{steps[step - 1]?.label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-primary/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-brand-lavender to-brand-nude transition-all duration-300"
            style={{ width: `${(step / maxStep) * 100}%` }}
          />
        </div>
        <ol className="flex justify-between gap-1">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 text-center",
                  !active && !done && "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    active && "border-primary bg-primary text-primary-foreground shadow-soft ring-4 ring-primary/15",
                    done && "border-primary/30 bg-brand-rose/70 text-foreground",
                    !active && !done && "border-primary/10 bg-white/80 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-[11px] font-medium sm:block",
                    active && "text-foreground",
                    done && "text-foreground",
                    !active && !done && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      </div>

      <Card className="overflow-hidden border-primary/15 bg-white shadow-elevated">
        <CardHeader className="border-b border-primary/10 bg-gradient-to-r from-white via-brand-cream/80 to-brand-rose/35 pb-4">
          <CardTitle className="text-base font-semibold sm:text-lg">
            {steps[step - 1]?.label}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {step === 1 && "Choose product type, then fill in the basic details."}
            {step === 2 && productType === "SIMPLE" &&
              "Set your buying and selling prices in Ghana cedis (₵)."}
            {step === 2 && productType === "VARIABLE" &&
              "Add each size or option with its own price and stock."}
            {step === 3 && productType === "SIMPLE" &&
              "Enter how many units you currently have in store."}
            {((step === 3 && productType === "VARIABLE") ||
              (step === 4 && productType === "SIMPLE")) &&
              "Review your product before saving."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          {step === 1 && (
            <>
              <FormSection title="Product photo">
                <ProductImagePicker
                  value={basic.imageUrl}
                  onChange={(url) => setBasic({ ...basic, imageUrl: url })}
                  productName={basic.name || "New product"}
                />
              </FormSection>

              <FormSection title="Product type">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TypeCard
                    active={productType === "SIMPLE"}
                    title="Normal product"
                    description="One price and one stock count."
                    icon={Package}
                    tone="primary"
                    onClick={() => setProductType("SIMPLE")}
                  />
                  <TypeCard
                    active={productType === "VARIABLE"}
                    title="Variable product"
                    description="Sizes, colors, or weights — each with its own price."
                    icon={Layers}
                    tone="lavender"
                    onClick={() => setProductType("VARIABLE")}
                  />
                </div>
              </FormSection>

              <FormSection title="Basic info">
                <div className="space-y-4">
                  <Field
                    label="Product name *"
                    placeholder="e.g. Classic White T-Shirt"
                    value={basic.name}
                    onChange={(v) =>
                      setBasic({
                        ...basic,
                        name: v,
                        sku: generateProductSku(v),
                      })
                    }
                    hint="The name customers and staff will see."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CodeField
                      label="SKU / product code"
                      placeholder="e.g. TSH-WHT-001"
                      value={basic.sku}
                      onChange={(v) => setBasic({ ...basic, sku: v })}
                      onRefresh={refreshSku}
                      refreshLabel="Regenerate SKU"
                      hint="Optional internal code for stock tracking"
                    />
                    <CodeField
                      label="Barcode"
                      placeholder="e.g. 601234567890"
                      value={basic.barcode}
                      onChange={(v) => setBasic({ ...basic, barcode: v })}
                      onRefresh={refreshBarcode}
                      refreshLabel="Regenerate barcode"
                      hint="Scan with barcode scanner or type manually"
                    />
                  </div>
                  <TextAreaField
                    label="Description (optional)"
                    placeholder="e.g. Soft cotton tee, unisex fit. Great for everyday wear."
                    value={basic.description}
                    onChange={(v) => setBasic({ ...basic, description: v })}
                    hint="Add a short note about material, size, color, or use."
                  />
                </div>
              </FormSection>

              <FormSection title="Classification">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Category"
                    placeholder="e.g. Clothing"
                    value={basic.categoryId}
                    onChange={(v) =>
                      setBasic({ ...basic, categoryId: v, subCategoryId: "" })
                    }
                    options={categories}
                    hint="Main group for this product."
                  />
                  <SelectField
                    label="Sub category"
                    placeholder="e.g. T-Shirts"
                    value={basic.subCategoryId}
                    onChange={(v) => setBasic({ ...basic, subCategoryId: v })}
                    options={subCategories}
                    disabled={!basic.categoryId}
                    hint="Smaller group under the selected category."
                  />
                  <SelectField
                    label="Brand"
                    placeholder="e.g. Nike"
                    value={basic.brandId}
                    onChange={(v) => setBasic({ ...basic, brandId: v })}
                    options={brands}
                    hint="Brand or supplier label for this product."
                  />
                  <SelectField
                    label="Unit"
                    placeholder="e.g. Piece"
                    value={basic.unitId}
                    onChange={(v) => setBasic({ ...basic, unitId: v })}
                    options={units}
                    hint="How this product is counted or sold."
                  />
                </div>
              </FormSection>
            </>
          )}

          {step === 2 && productType === "SIMPLE" && (
            <FormSection
              title="Simple product pricing"
              description="Set the prices staff will see when selling this product."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <PriceField
                  label="Buying price"
                  hint="Your cost for one item. Example: if you bought it for ₵45, enter 45.00."
                  placeholder="e.g. 45.00"
                  value={pricing.costPrice}
                  onChange={(v) => setPricing({ ...pricing, costPrice: v })}
                />
                <PriceField
                  label="Selling price *"
                  hint="Normal customer price at POS. Example: sell it for ₵89, enter 89.00."
                  placeholder="e.g. 89.00"
                  value={pricing.retailPrice}
                  onChange={(v) => setPricing({ ...pricing, retailPrice: v })}
                />
                <PriceField
                  label="Wholesale price"
                  hint="Lower price for bulk buyers. Example: bulk price ₵70, enter 70.00."
                  placeholder="e.g. 70.00"
                  value={pricing.wholesalePrice}
                  onChange={(v) => setPricing({ ...pricing, wholesalePrice: v })}
                />
                <PriceField
                  label="Lowest price"
                  hint="Minimum price staff can sell for. Example: do not sell below ₵75, enter 75.00."
                  placeholder="e.g. 75.00"
                  value={pricing.minimumPrice}
                  onChange={(v) => setPricing({ ...pricing, minimumPrice: v })}
                />
                {simplePricingValidation &&
                  (simplePricingValidation.errors.length > 0 ||
                    simplePricingValidation.warnings.length > 0) && (
                    <div className="space-y-1 text-xs sm:col-span-2">
                      {simplePricingValidation.errors.map((e) => (
                        <p key={e} className="text-destructive">
                          {e}
                        </p>
                      ))}
                      {simplePricingValidation.warnings.map((w) => (
                        <p key={w} className="text-amber-700">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}
              </div>
            </FormSection>
          )}

          {step === 2 && productType === "VARIABLE" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-brand-cream/80 via-white to-brand-rose/35 p-3 shadow-card">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CircleDollarSign className="size-4 text-primary" />
                  Variant tools
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full bg-primary/25 hover:bg-primary/35 sm:w-auto"
                    onClick={addSizePresets}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Add sizes XS–XXL
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 bg-white/80 sm:w-auto"
                    onClick={applyPricingFromFirst}
                  >
                    Copy prices from first
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-primary/20 bg-white/80 sm:w-auto"
                    onClick={() => setVariants([...variants, emptyVariant()])}
                  >
                    <Plus className="mr-1 size-3.5" />
                    Add option
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {variants.map((v, i) => (
                  <VariantRowCard
                    key={v.key}
                    index={i}
                    variant={v}
                    canRemove={variants.length > 1}
                    onChange={(next) => updateVariant(i, next)}
                    onRemove={() => removeVariant(i)}
                  />
                ))}
              </div>

              <Field
                label="Low stock alert (all variants)"
                placeholder="e.g. 5"
                value={stock.stockAlert}
                onChange={(v) => setStock({ ...stock, stockAlert: v })}
                hint="Show a warning when total stock is below this number."
              />
            </div>
          )}

          {step === 3 && productType === "SIMPLE" && (
            <FormSection
              title="Opening stock"
              description="Start with the quantity currently available in your store."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Opening stock"
                  placeholder="e.g. 24"
                  value={stock.quantity}
                  onChange={(v) => setStock({ ...stock, quantity: v })}
                  type="number"
                  hint="How many pieces you have now."
                />
                <Field
                  label="Low stock alert"
                  placeholder="e.g. 5"
                  value={stock.stockAlert}
                  onChange={(v) => setStock({ ...stock, stockAlert: v })}
                  type="number"
                  hint="Show a warning when stock reaches this number."
                />
              </div>
            </FormSection>
          )}

          {((step === 3 && productType === "VARIABLE") ||
            (step === 4 && productType === "SIMPLE")) && (
            <ReviewPanel
              basic={basic}
              productType={productType}
              pricing={pricing}
              variants={filledVariants()}
              stock={stock}
              categories={categories}
            />
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 mt-6 flex flex-col-reverse gap-2 rounded-2xl border border-primary/15 bg-white/95 p-3 shadow-soft backdrop-blur-sm sm:static sm:flex-row sm:justify-between sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {step < maxStep ? (
            <Button
              className="w-full sm:w-auto"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate(true)}
              >
                Save & add another
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate(false)}
              >
                {saveMutation.isPending ? "Saving…" : "Save product"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeCard({
  active,
  title,
  description,
  icon: Icon,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "lavender";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative min-h-[150px] overflow-hidden rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 touch-manipulation",
        active
          ? "border-primary bg-gradient-to-br from-white via-brand-cream/80 to-primary/25 shadow-elevated ring-4 ring-primary/20"
          : "border-gray-200 bg-white shadow-sm hover:border-primary/50 hover:bg-brand-cream/40 hover:shadow-card",
      )}
    >
      {active && (
        <span className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-primary" />
      )}
      <span
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-28 rounded-full blur-2xl transition-opacity",
          active ? "opacity-70" : "opacity-0 group-hover:opacity-40",
          tone === "primary" ? "bg-primary" : "bg-brand-lavender",
        )}
      />
      <span className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
            tone === "primary"
              ? "bg-primary/35 text-foreground"
              : "bg-brand-lavender/45 text-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border text-[10px] transition-all",
            active
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-primary/15 bg-white text-transparent",
          )}
        >
          <Check className="size-3.5" />
        </span>
      </span>
      <span className="relative mt-4 block">
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <Input
        type={type}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        value={value}
        className="h-12 rounded-xl border-2 border-gray-200 bg-white px-4 shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CodeField({
  label,
  placeholder,
  value,
  onChange,
  onRefresh,
  refreshLabel,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
  refreshLabel: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          className="h-12 rounded-xl border-2 border-gray-200 bg-white px-4 font-mono text-sm shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="h-12 w-12 shrink-0 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-primary/50 hover:bg-brand-rose/35"
          onClick={onRefresh}
          aria-label={refreshLabel}
          title={refreshLabel}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <textarea
        placeholder={placeholder}
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="flex min-h-[110px] w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-primary/30"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  disabled?: boolean;
  hint?: string;
}) {
  const selectedOption = options.find((o) => o.id === value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
        <SelectTrigger className="h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30 disabled:bg-muted/50">
          <span
            className={cn(
              "block flex-1 truncate text-left",
              !selectedOption && "text-muted-foreground",
            )}
          >
            {selectedOption?.name ?? placeholder}
          </span>
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-primary/15 bg-white p-1 shadow-elevated">
          {options.map((o) => (
            <SelectItem
              key={o.id}
              value={o.id}
              className="rounded-lg px-3 py-2.5 text-sm hover:bg-brand-rose/35 focus:bg-brand-rose/45"
            >
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PriceField({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          ₵
        </span>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder={placeholder}
          className="h-12 rounded-xl border-2 border-gray-200 bg-white pl-8 shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ReviewPanel({
  basic,
  productType,
  pricing,
  variants,
  stock,
  categories,
}: {
  basic: {
    name: string;
    sku: string;
    categoryId: string;
    imageUrl: string;
    description: string;
  };
  productType: "SIMPLE" | "VARIABLE";
  pricing: {
    retailPrice: string;
    costPrice: string;
    wholesalePrice: string;
  };
  variants: VariantDraft[];
  stock: { quantity: string; stockAlert: string };
  categories: CatalogItem[];
}) {
  const categoryName = categories.find((c) => c.id === basic.categoryId)?.name;

  return (
    <div className="space-y-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-brand-cream/70 via-white to-brand-rose/35 p-4 shadow-card">
      <div className="flex gap-4">
        <ProductThumbnail
          imageUrl={basic.imageUrl}
          name={basic.name}
          className="size-20 shrink-0 rounded-xl sm:size-24"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold">{basic.name}</p>
            <Badge className="border-0 bg-primary/35 text-foreground">
              {productType === "SIMPLE" ? "Normal" : "Variable"}
            </Badge>
          </div>
          {basic.sku && (
            <p className="mt-1 text-sm text-muted-foreground">SKU: {basic.sku}</p>
          )}
          {categoryName && (
            <p className="text-sm text-muted-foreground">Category: {categoryName}</p>
          )}
          {basic.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {basic.description}
            </p>
          )}
        </div>
      </div>

      {productType === "SIMPLE" ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <ReviewMetric label="Selling" value={`₵${Number(pricing.retailPrice || 0).toFixed(2)}`} />
          <ReviewMetric label="Cost" value={`₵${Number(pricing.costPrice || 0).toFixed(2)}`} />
          <ReviewMetric label="Wholesale" value={`₵${Number(pricing.wholesalePrice || 0).toFixed(2)}`} />
          <ReviewMetric label="Opening stock" value={`${stock.quantity} units`} />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">{variants.length} options</p>
          <ul className="space-y-1 text-sm">
            {variants.map((v) => (
              <li
                key={v.key}
                className="flex flex-wrap justify-between gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2 shadow-sm"
              >
                <span>{v.name}</span>
                <span className="text-muted-foreground">
                  ₵{Number(v.retailPrice).toFixed(2)} · stock {v.stockQuantity}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Total stock:{" "}
            {variants.reduce((s, v) => s + Number(v.stockQuantity || 0), 0)} units
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
