"use client";

import { useEffect } from "react";
import { AdminNotice, AdminButton } from "@/components/admin/AdminChrome";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <AdminNotice variant="error">
        <p className="font-semibold">Admin couldn’t load</p>
        <p className="mt-1">
          A server error interrupted this page. Try again, or sign in once more.
        </p>
        {error.digest ? (
          <p className="admin-field-hint mt-2">Error ref: {error.digest}</p>
        ) : null}
      </AdminNotice>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="admin-button-primary" onClick={reset}>
          Try again
        </button>
        <AdminButton href="/admin" secondary>
          Reload dashboard
        </AdminButton>
        <AdminButton href="/admin/login" secondary>
          Back to login
        </AdminButton>
      </div>
    </div>
  );
}
