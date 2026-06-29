"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteAboutTeamMemberFormAction,
  updateAboutTeamMemberStatusAction,
} from "@/app/admin/actions/about-team";
import { ImportDefaultTeamButton } from "@/components/admin/ImportDefaultTeamButton";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminAboutTeamMember } from "@/lib/about-team";
import type { StaffRole } from "@/lib/supabase/auth";

type Filter = "all" | "published" | "draft";

type Props = {
  members: AdminAboutTeamMember[];
  role: StaffRole;
};

function filterCount(members: AdminAboutTeamMember[], filter: Filter) {
  if (filter === "all") return members.length;
  return members.filter((member) => member.status === filter).length;
}

function MemberRow({ member, role }: { member: AdminAboutTeamMember; role: StaffRole }) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateAboutTeamMemberStatusAction,
    undefined,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAboutTeamMemberFormAction,
    undefined,
  );

  useAdminActionFeedback(statusState, statusPending, {
    loadingMessage: "Updating team member…",
  });
  useAdminActionFeedback(deleteState, deletePending, {
    loadingMessage: "Deleting team member…",
  });

  const nextStatus = member.status === "published" ? "draft" : "published";
  const statusLabel = member.status === "published" ? "Unpublish" : "Publish";

  return (
    <tr>
      <td className="w-14">
        <Link
          href={`/admin/about/${member.id}/edit`}
          className="admin-tour-thumb"
          aria-label={`Edit ${member.name}`}
        >
          {member.image ? (
            <Image
              src={member.image}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 object-cover object-top"
              unoptimized={!member.image.includes("supabase.co")}
            />
          ) : (
            <span className="admin-tour-thumb-empty" aria-hidden>
              {member.name.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
      </td>
      <td className="min-w-[180px]">
        <Link href={`/admin/about/${member.id}/edit`} className="admin-row-title">
          {member.name}
        </Link>
        <div className="text-[12px] font-medium text-[#646970]">{member.role}</div>
        {member.bio ? (
          <p className="mt-1 line-clamp-2 text-[12px] text-[#646970]">{member.bio}</p>
        ) : null}
      </td>
      <td>
        <StatusBadge status={member.status} />
      </td>
      <td className="hidden text-[#646970] md:table-cell">{member.sortOrder}</td>
      <td className="hidden lg:table-cell">
        <div className="admin-row-actions">
          <Link href={`/admin/about/${member.id}/edit`}>Edit</Link>
          <span aria-hidden>|</span>
          <form action={statusAction} className="inline">
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button type="submit" disabled={statusPending} className="admin-row-action-link">
              {statusPending ? "…" : statusLabel}
            </button>
          </form>
          {role === "admin" ? (
            <>
              <span aria-hidden>|</span>
              <form
                action={deleteAction}
                className="inline"
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Delete ${member.name} from the About page? This cannot be undone.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={member.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  className="admin-row-action-delete inline"
                >
                  {deletePending ? "…" : "Delete"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function AboutTeamList({ members, role }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return members;
    return members.filter((member) => member.status === filter);
  }, [filter, members]);

  const published = members.filter((member) => member.status === "published").length;
  const drafts = members.filter((member) => member.status === "draft").length;

  return (
    <>
      <div className="admin-about-top">
        <div className="admin-about-stats">
          <div className="admin-about-stat">
            <span className="admin-about-stat-value">{members.length}</span>
            <span className="admin-about-stat-label">Total</span>
          </div>
          <div className="admin-about-stat">
            <span className="admin-about-stat-value">{published}</span>
            <span className="admin-about-stat-label">Published</span>
          </div>
          <div className="admin-about-stat">
            <span className="admin-about-stat-value">{drafts}</span>
            <span className="admin-about-stat-label">Draft</span>
          </div>
        </div>

        <div className="admin-about-toolbar">
          <ul className="admin-subsubsub">
            {(["all", "published", "draft"] as const).map((value) => (
              <li key={value}>
                <button
                  type="button"
                  className={filter === value ? "current" : ""}
                  onClick={() => setFilter(value)}
                >
                  {value === "all"
                    ? "All"
                    : value === "published"
                      ? "Published"
                      : "Draft"}{" "}
                  ({filterCount(members, value)})
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table admin-about-table">
            <thead>
              <tr>
                <th className="w-14" aria-label="Photo" />
                <th>Team member</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Order</th>
                <th className="hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#646970]">
                    {members.length === 0 ? (
                      <div className="space-y-4">
                        <p>
                          No team members in the database yet. Import the people currently shown
                          on your About page to start editing them here.
                        </p>
                        <ImportDefaultTeamButton />
                      </div>
                    ) : (
                      "No team members match this filter."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <MemberRow key={member.id} member={member} role={role} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
