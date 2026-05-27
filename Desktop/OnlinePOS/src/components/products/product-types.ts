export type ProductVariantRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minimumPrice: number;
  stockQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
};

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  productType: "SIMPLE" | "VARIABLE";
  price: number;
  costPrice: number;
  wholesalePrice: number;
  minimumPrice: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  stockAlert: number;
  isActive: boolean;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  unit: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  categoryRef?: { id: string; name: string } | null;
  subCategoryRef?: { id: string; name: string } | null;
  brandRef?: { id: string; name: string } | null;
  unitRef?: {
    id: string;
    name: string;
    abbreviation: string | null;
  } | null;
  variants?: ProductVariantRow[];
  _count?: { variants: number };
};

export type CatalogItem = {
  id: string;
  name: string;
  _count?: { products: number };
};

export type SubCategoryItem = {
  id: string;
  name: string;
  categoryId: string;
  category?: { id: string; name: string };
  _count?: { products: number };
};

export type VariantDraft = {
  key: string;
  name: string;
  sku: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  minimumPrice: string;
  stockQuantity: string;
};

export function displayRetailPrice(p: ProductRow): string {
  if (p.productType === "VARIABLE") {
    if (p.variants?.length) {
      const prices = p.variants.map((v) => v.retailPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? min.toFixed(2) : `${min.toFixed(2)} – ${max.toFixed(2)}`;
    }
    const n = p._count?.variants ?? 0;
    return n > 0 ? `${n} variants` : "—";
  }
  return p.price.toFixed(2);
}

export function displayWholesalePrice(p: ProductRow): string {
  if (p.productType === "VARIABLE" && p.variants?.length) {
    const prices = p.variants.map((v) => v.wholesalePrice);
    const min = Math.min(...prices);
    return min.toFixed(2);
  }
  return p.wholesalePrice.toFixed(2);
}
