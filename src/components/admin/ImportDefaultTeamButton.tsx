"use client";

import { useActionState } from "react";
import { importDefaultAboutTeamMembersAction } from "@/app/admin/actions/about-team";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";

export function ImportDefaultTeamButton() {
  const [state, formAction, pending] = useActionState(importDefaultAboutTeamMembersAction, undefined);

  useAdminActionFeedback(state, pending, {
    loadingMessage: "Importing team members…",
  });

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className="admin-button-primary">
        {pending ? "Importing…" : "Import About page team"}
      </button>
    </form>
  );
}
