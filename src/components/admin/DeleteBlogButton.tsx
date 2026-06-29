"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { deleteBlogPostFormAction } from "@/app/admin/actions/blog";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";

type Props = {
  id: string;
  title: string;
  redirectOnDelete?: boolean;
};

export function DeleteBlogButton({
  id,
  title,
  redirectOnDelete = false,
}: Props) {
  const router = useRouter();
  const [state, deleteAction, pending] = useActionState(
    deleteBlogPostFormAction,
    undefined,
  );

  useAdminActionFeedback(state, pending, {
    loadingMessage: "Deleting post…",
    refresh: !redirectOnDelete,
  });

  useEffect(() => {
    if (redirectOnDelete && state?.success) {
      router.push("/admin/blog");
    }
  }, [redirectOnDelete, router, state]);

  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="admin-row-action-delete">
        {pending ? "Deleting…" : "Delete post"}
      </button>
    </form>
  );
}
