"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

type Props = {
  message?: string;
  param?: string;
};

function AdminSavedQueryToastInner({
  message = "Saved successfully.",
  param = "saved",
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useAdminToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (searchParams.get(param) !== "1" || shownRef.current) return;
    shownRef.current = true;
    success(message);

    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [message, param, pathname, router, searchParams, success]);

  return null;
}

export function AdminSavedQueryToast(props: Props) {
  return (
    <Suspense fallback={null}>
      <AdminSavedQueryToastInner {...props} />
    </Suspense>
  );
}
