export function ToursSectionSkeleton() {
  return (
    <section className="bg-cream py-20 lg:py-28" aria-hidden>
      <div className="section-container">
        <div className="mb-10 h-24 max-w-md animate-pulse rounded-2xl bg-parchment" />
        <div className="grid gap-6 lg:max-w-md">
          <div className="overflow-hidden border border-gray-100 bg-white">
            <div className="aspect-[4/3] animate-pulse bg-parchment" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/3 animate-pulse rounded bg-parchment" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-parchment" />
              <div className="h-4 w-full animate-pulse rounded bg-parchment" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlogSectionSkeleton() {
  return (
    <section className="bg-cream py-20 lg:py-28" aria-hidden>
      <div className="section-container">
        <div className="h-24 max-w-2xl animate-pulse rounded-2xl bg-parchment" />
        <div className="mt-10 grid overflow-hidden rounded-2xl lg:grid-cols-[1.15fr_0.85fr]">
          <div className="min-h-[260px] animate-pulse bg-parchment lg:min-h-[380px]" />
          <div className="space-y-4 bg-navy/10 p-8">
            <div className="h-4 w-1/3 animate-pulse rounded bg-parchment" />
            <div className="h-8 w-full animate-pulse rounded bg-parchment" />
            <div className="h-16 w-full animate-pulse rounded bg-parchment" />
          </div>
        </div>
      </div>
    </section>
  );
}
