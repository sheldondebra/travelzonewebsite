import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getPublicStore } from "@/server/services/marketplace/list-marketplace";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  return {
    title: store ? `${store.name} | Store` : "Store",
    description: store?.description ?? undefined,
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const store = await getPublicStore(slug);
  if (!store) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-48 bg-gradient-to-br from-brand-rose/70 to-primary/40"
        style={
          store.bannerUrl
            ? {
                backgroundImage: `url(${store.bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <div className="-mt-12 mb-8 flex flex-wrap items-end gap-4">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt=""
              className="size-24 rounded-2xl border-4 border-white bg-white object-cover shadow-soft"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-primary text-2xl font-semibold text-primary-foreground shadow-soft">
              {store.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 space-y-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold">{store.name}</h1>
              {store.isVerified && (
                <BadgeCheck className="size-6 text-primary" />
              )}
            </div>
            {store.description && (
              <p className="text-muted-foreground max-w-2xl">
                {store.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              {store.badges.map((b) => (
                <Badge key={b} variant="secondary">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold">Products</h2>
        {store.products.length === 0 ? (
          <p className="text-muted-foreground">No products listed yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((product) => (
              <Link
                key={product.id}
                href={`/store/${slug}/product/${product.slug}`}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition hover:border-primary/30"
              >
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="mb-3 h-40 w-full rounded-xl object-cover"
                  />
                )}
                <p className="font-medium">{product.name}</p>
                <p className="text-primary font-semibold">
                  {store.currency} {product.price.toFixed(2)}
                </p>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <p className="text-sm text-muted-foreground line-through">
                    {product.compareAtPrice.toFixed(2)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {store.reviews.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
            <div className="space-y-3">
              {store.reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-100 bg-white p-4"
                >
                  <p className="font-medium">
                    {"★".repeat(r.rating)}
                    {r.customerName ? ` · ${r.customerName}` : ""}
                  </p>
                  {r.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
