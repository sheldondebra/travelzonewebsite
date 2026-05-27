import { z } from "zod";
import { isGarbageProductName } from "@/lib/import/detect-garbage";
import { assertPricingValid } from "@/lib/products/pricing";

const pricingFields = z.object({
  costPrice: z.number().nonnegative(),
  price: z.number().nonnegative(),
  wholesalePrice: z.number().nonnegative().default(0),
  minimumPrice: z.number().nonnegative().default(0),
});

export const variantInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  costPrice: z.number().nonnegative(),
  retailPrice: z.number().nonnegative(),
  wholesalePrice: z.number().nonnegative().default(0),
  minimumPrice: z.number().nonnegative().default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  imageUrl: z.string().optional().or(z.literal("")),
});

const imageUrlSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) =>
      !val ||
      val.startsWith("/") ||
      val.startsWith("http://") ||
      val.startsWith("https://"),
    { message: "Image must be a URL or path starting with /" },
  );

const productBaseSchema = z
  .object({
    name: z.string().min(1),
    productType: z.enum(["SIMPLE", "VARIABLE"]).default("SIMPLE"),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    compareAtPrice: z.number().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().default(0),
    stockAlert: z.number().int().nonnegative().default(5),
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional(),
    brandId: z.string().optional(),
    unitId: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    brand: z.string().optional(),
    unit: z.string().optional(),
    imageUrl: imageUrlSchema,
    isPublic: z.boolean().optional(),
    isActive: z.boolean().optional(),
    variants: z.array(variantInputSchema).optional(),
  })
  .merge(pricingFields);

function refineProductPricing(
  data: z.infer<typeof productBaseSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.productType === "SIMPLE") {
    try {
      assertPricingValid({
        costPrice: data.costPrice,
        retailPrice: data.price,
        wholesalePrice: data.wholesalePrice,
        minimumPrice: data.minimumPrice,
      });
    } catch (e) {
      ctx.addIssue({
        code: "custom",
        message: e instanceof Error ? e.message : "Invalid pricing",
        path: ["price"],
      });
    }
  }
  if (data.productType === "VARIABLE") {
    if (!data.variants?.length) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one variant for a variable product.",
        path: ["variants"],
      });
    }
    data.variants?.forEach((v, i) => {
      try {
        assertPricingValid({
          costPrice: v.costPrice,
          retailPrice: v.retailPrice,
          wholesalePrice: v.wholesalePrice,
          minimumPrice: v.minimumPrice,
        });
      } catch (e) {
        ctx.addIssue({
          code: "custom",
          message: e instanceof Error ? e.message : "Invalid variant pricing",
          path: ["variants", i, "retailPrice"],
        });
      }
    });
  }
}

export const productFieldsSchema = productBaseSchema.superRefine(
  refineProductPricing,
);

export const createProductSchema = productFieldsSchema;
export const updateProductSchema = productBaseSchema.partial();

export const adjustPriceSchema = z.object({
  costPrice: z.number().nonnegative().optional(),
  retailPrice: z.number().nonnegative().optional(),
  wholesalePrice: z.number().nonnegative().optional(),
  minimumPrice: z.number().nonnegative().optional(),
  reason: z.string().optional(),
});

export const bulkAdjustPriceSchema = z.object({
  productIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  productType: z.enum(["SIMPLE", "VARIABLE"]).optional(),
  method: z.enum([
    "retail_percent_up",
    "retail_percent_down",
    "retail_fixed_up",
    "retail_fixed_down",
    "set_wholesale",
    "set_minimum",
  ]),
  value: z.number(),
  reason: z.string().optional(),
});

export const catalogNameSchema = z.object({
  name: z.string().min(1).max(80),
  abbreviation: z.string().max(10).optional(),
  categoryId: z.string().optional(),
});

export const importProductsSchema = z.object({
  rows: z.array(
    z.object({
      name: z
        .string()
        .min(1)
        .refine((n) => !isGarbageProductName(n), {
          message: "Invalid product name (looks like SQL dump content)",
        }),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      price: z.number().nonnegative(),
      costPrice: z.number().nonnegative().default(0),
      wholesalePrice: z.number().nonnegative().default(0),
      minimumPrice: z.number().nonnegative().default(0),
      stockQuantity: z.number().int().nonnegative().default(0),
      category: z.string().optional(),
      subCategory: z.string().optional(),
      brand: z.string().optional(),
      unit: z.string().optional(),
    }),
  ),
});

export const openingStockSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().nonnegative(),
    }),
  ),
});

export const stockCountSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      countedQuantity: z.number().int().nonnegative(),
    }),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
