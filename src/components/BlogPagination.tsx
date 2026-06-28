import Link from "next/link";

type BlogPaginationProps = {
  currentPage: number;
  totalPages: number;
};

function pageHref(page: number) {
  return page === 1 ? "/blog" : `/blog?page=${page}`;
}

export function BlogPagination({ currentPage, totalPages }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      className="mt-16 flex flex-wrap items-center justify-center gap-2"
      aria-label="Blog pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          className="inline-flex items-center justify-center rounded-full border-2 border-navy px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          ← Previous
        </Link>
      ) : (
        <span
          aria-hidden
          className="inline-flex cursor-not-allowed items-center justify-center rounded-full border-2 border-parchment px-5 py-2.5 text-sm font-semibold text-text-muted/50"
        >
          ← Previous
        </span>
      )}

      <div className="flex items-center gap-1.5 px-1">
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <Link
              key={page}
              href={pageHref(page)}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-navy px-3 text-sm font-semibold text-white"
                  : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-parchment px-3 text-sm font-semibold text-navy transition-colors hover:border-brand-red hover:text-brand-red"
              }
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          className="inline-flex items-center justify-center rounded-full border-2 border-navy px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          Next →
        </Link>
      ) : (
        <span
          aria-hidden
          className="inline-flex cursor-not-allowed items-center justify-center rounded-full border-2 border-parchment px-5 py-2.5 text-sm font-semibold text-text-muted/50"
        >
          Next →
        </span>
      )}
    </nav>
  );
}
