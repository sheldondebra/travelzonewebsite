"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE, paginateArray } from "@/lib/pagination";

export function useClientPagination<T>(
  items: T[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  resetDeps: unknown[] = [],
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const paginated = useMemo(
    () => paginateArray(items, page, pageSize),
    [items, page, pageSize],
  );

  return {
    ...paginated,
    setPage,
  };
}
