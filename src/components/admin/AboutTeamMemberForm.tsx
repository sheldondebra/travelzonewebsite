"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveAboutTeamMemberAction } from "@/app/admin/actions/about-team";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import { ImageUpload } from "@/components/admin/ImageUpload";
import type { AdminAboutTeamMember } from "@/lib/about-team";
import type { ContentStatus } from "@/lib/content-types";

type Props = {
  member?: AdminAboutTeamMember;
};

export function AboutTeamMemberForm({ member }: Props) {
  const isNew = !member;
  const [state, formAction, pending] = useActionState(saveAboutTeamMemberAction, undefined);

  useAdminActionFeedback(state, pending, {
    loadingMessage: isNew ? "Creating team member…" : "Saving team member…",
    refresh: false,
  });

  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [bio, setBio] = useState(member?.bio ?? "");
  const [image, setImage] = useState(member?.image ?? "");
  const [sortOrder, setSortOrder] = useState(String(member?.sortOrder ?? 0));
  const [status, setStatus] = useState<ContentStatus>(member?.status ?? "published");

  const title = useMemo(
    () => (isNew ? "Add team member" : `Edit ${member.name}`),
    [isNew, member?.name],
  );

  return (
    <form action={formAction} className="admin-postbox">
      <div className="admin-postbox-header">
        <h2>{title}</h2>
      </div>

      <div className="admin-postbox-body space-y-4">
        {member ? <input type="hidden" name="id" value={member.id} /> : null}

        <div className="admin-form-grid-2">
          <div>
            <label htmlFor="about-name" className="admin-label">
              Name <span className="text-[#d63638]">(required)</span>
            </label>
            <input
              id="about-name"
              name="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input"
            />
          </div>

          <div>
            <label htmlFor="about-role" className="admin-label">
              Role <span className="text-[#d63638]">(required)</span>
            </label>
            <input
              id="about-role"
              name="role"
              required
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="admin-input"
              placeholder="CEO"
            />
          </div>
        </div>

        <div>
          <label htmlFor="about-bio" className="admin-label">
            Bio
          </label>
          <textarea
            id="about-bio"
            name="bio"
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="admin-input"
          />
        </div>

        <ImageUpload
          label="Photo"
          folder="team"
          value={image}
          onChange={setImage}
        />
        <input type="hidden" name="image" value={image} />

        <div className="admin-form-grid-2">
          <div>
            <label htmlFor="about-sort" className="admin-label">
              Display order
            </label>
            <input
              id="about-sort"
              name="sortOrder"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="admin-input"
            />
            <p className="admin-field-hint">Lower numbers appear first on the About page.</p>
          </div>

          <div>
            <label htmlFor="about-status" className="admin-label">
              Status
            </label>
            <select
              id="about-status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ContentStatus)}
              className="admin-input"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={pending} className="admin-button-primary">
            {pending ? "Saving…" : isNew ? "Create team member" : "Save changes"}
          </button>
          <Link href="/admin/about" className="admin-button-secondary">
            Back to list
          </Link>
        </div>
      </div>
    </form>
  );
}
