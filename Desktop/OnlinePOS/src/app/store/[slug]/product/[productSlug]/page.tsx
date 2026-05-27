import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/server/services/marketplace/list-marketplace";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string; productSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, productSlug } = await params;
  const product = await getPublicProduct(slug, productSlug);
  return {
    title: product ? `${product.name} | ${product.business.name}` : "Product",
    description: product?.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, productSlug } = await params;
  const product = await getPublicProduct(slug, productSlug);
  if (!product) notFound();

  const inStock = product.stockQuantity > 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href={`/store/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {product.business.name}
        </Link>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-brand-rose/30 p-4">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-white/60 text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">{product.name}</h1>
            {product.category && (
              <p className="text-sm text-muted-foreground">{product.category}</p>
            )}
            <p className="text-3xl font-semibold text-primary">
              {product.business.currency} {product.price.toFixed(2)}
            </p>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <p className="text-muted-foreground line-through">
                  Was {product.compareAtPrice.toFixed(2)}
                </p>
              )}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
            <p
              className={cn(
                "text-sm font-medium",
                inStock ? "text-green-700" : "text-destructive",
              )}
            >
              {inStock
                ? `${product.stockQuantity} in stock`
                : "Out of stock"}
            </p>
            <p className="text-sm text-muted-foreground">
              Order via WhatsApp or Instagram — contact the seller directly.
            </p>
            <Link
              href={`/store/${slug}`}
              className={cn(buttonVariants(), "inline-flex")}
            >
              View store
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
