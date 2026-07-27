"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminNotice, AdminButton } from "@/components/admin/AdminChrome";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[admin dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <AdminNotice variant="error">
        <p className="font-semibold">Dashboard couldn’t load</p>
        <p className="mt-1">
          A server error interrupted this page. This is usually a temporary database
          or settings timeout — try again.
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
        <button
          type="button"
          className="admin-button-secondary"
          onClick={() => router.refresh()}
        >
          Refresh
        </button>
        <AdminButton href="/admin/login" secondary>
          Back to login
        </AdminButton>
      </div>
    </div>
  );
}
