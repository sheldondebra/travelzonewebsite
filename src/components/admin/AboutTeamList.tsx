"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteAboutTeamMemberFormAction,
  updateAboutTeamMemberStatusAction,
  type AboutTeamActionResult,
} from "@/app/admin/actions/about-team";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminAboutTeamMember } from "@/lib/about-team";
import type { StaffRole } from "@/lib/supabase/auth";

type Filter = "all" | "published" | "draft";

type Props = {
  members: AdminAboutTeamMember[];
  role: StaffRole;
};

function MemberRow({
  member,
  role,
  onActionResult,
}: {
  member: AdminAboutTeamMember;
  role: StaffRole;
  onActionResult: (result: AboutTeamActionResult) => void;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateAboutTeamMemberStatusAction,
    undefined,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAboutTeamMemberFormAction,
    undefined,
  );

  useEffect(() => {
    if (statusState) onActionResult(statusState);
  }, [statusState, onActionResult]);

  useEffect(() => {
    if (deleteState) onActionResult(deleteState);
  }, [deleteState, onActionResult]);

  const nextStatus = member.status === "published" ? "draft" : "published";
  const statusLabel = member.status === "published" ? "Unpublish" : "Publish";

  return (
    <tr>
      <td className="w-14">
        <Link href={`/admin/about/${member.id}/edit`} className="block overflow-hidden rounded-[3px]">
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
      <td>
        <Link href={`/admin/about/${member.id}/edit`} className="font-semibold text-[#2271b1]">
          {member.name}
        </Link>
        <p className="mt-0.5 text-[12px] text-[#646970]">{member.role}</p>
      </td>
      <td>
        <StatusBadge status={member.status} />
      </td>
      <td className="text-[#646970]">{member.sortOrder}</td>
      <td className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/admin/about/${member.id}/edit`} className="admin-row-action-link">
            Edit
          </Link>
          <form action={statusAction}>
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button type="submit" disabled={statusPending} className="admin-row-action-link">
              {statusPending ? "…" : statusLabel}
            </button>
          </form>
          {role === "admin" ? (
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(`Delete ${member.name} from the About page? This cannot be undone.`)
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="admin-row-action-delete"
              >
                {deletePending ? "…" : "Delete"}
              </button>
            </form>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function AboutTeamList({ members, role }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState<AboutTeamActionResult | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return members;
    return members.filter((member) => member.status === filter);
  }, [filter, members]);

  useEffect(() => {
    if (notice?.success) router.refresh();
  }, [notice, router]);

  return (
    <div>
      {notice ? (
        <div className="mb-4">
          <AdminNotice variant={notice.success ? "success" : "error"}>
            {notice.success ? notice.message : notice.error}
          </AdminNotice>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "published", "draft"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-[3px] px-3 py-1.5 text-[13px] ${
              filter === value
                ? "bg-[#2271b1] text-white"
                : "bg-white text-[#1d2327] ring-1 ring-[#c3c4c7]"
            }`}
          >
            {value === "all" ? "All" : value === "published" ? "Published" : "Draft"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[3px] border border-[#c3c4c7] bg-white px-4 py-8 text-center text-[13px] text-[#646970]">
          No team members yet. Add the people shown on your About page.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-list-table">
            <thead>
              <tr>
                <th aria-label="Photo" />
                <th>Name</th>
                <th>Status</th>
                <th>Order</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  role={role}
                  onActionResult={setNotice}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
