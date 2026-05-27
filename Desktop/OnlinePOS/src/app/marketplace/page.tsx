import Link from "next/link";
import { BadgeCheck, Store } from "lucide-react";
import { listMarketplaceStores } from "@/server/services/marketplace/list-marketplace";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Marketplace | Social Commerce",
  description: "Discover verified African social commerce stores",
};

export default async function MarketplacePage() {
  const stores = await listMarketplaceStores();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-100 bg-white/80 px-6 py-6 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary">
              <Store className="size-4 text-primary-foreground" />
            </span>
            Tecunit Marketplace
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Seller login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            Discover stores
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Browse public storefronts from social sellers across Ghana and beyond.
          </p>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-brand-rose/20 p-12 text-center">
            <p className="text-muted-foreground">
              No public stores yet. Enable your storefront in dashboard settings.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants(), "mt-4 inline-flex")}
            >
              Start selling
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft transition hover:border-primary/40"
              >
                <div
                  className="h-28 bg-gradient-to-br from-brand-rose/80 to-primary/30"
                  style={
                    store.bannerUrl
                      ? {
                          backgroundImage: `url(${store.bannerUrl})`,
                          backgroundSize: "cover",
                        }
                      : undefined
                  }
                />
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold group-hover:text-primary">
                      {store.name}
                    </h2>
                    {store.isVerified && (
                      <BadgeCheck className="size-5 shrink-0 text-primary" />
                    )}
                  </div>
                  {store.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {store.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {store.badges.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs">
                        {b}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {store._count.products} products ·{" "}
                    {store.reputationScore.toFixed(0)} reputation
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
