import { cache } from "react";
import type {
  AboutTeamMember,
  AboutTeamMemberInput,
  AdminAboutTeamMember,
} from "@/lib/about-team";
import { teamMembers as fallbackTeamMembers } from "@/lib/content";
import type { ContentStatus } from "@/lib/content-types";
import { isDatabaseConfigured } from "@/lib/db/config";
import { databaseSetupError, isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";
import { normalizeMediaUrl } from "@/lib/media-url";

const DEFAULT_ABOUT_TEAM_MEMBER_IDS = [
  "a1111111-1111-4111-8111-111111111101",
  "a1111111-1111-4111-8111-111111111102",
  "a1111111-1111-4111-8111-111111111103",
] as const;

function rowToMember(row: Record<string, unknown>): AdminAboutTeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as string,
    bio: (row.bio as string) ?? "",
    image: normalizeMediaUrl((row.image as string) ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status as ContentStatus,
    updatedAt: row.updated_at as string,
  };
}

function toPublicMember(member: AdminAboutTeamMember): AboutTeamMember {
  return {
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: member.image,
  };
}

function fallbackMembers(): AboutTeamMember[] {
  return fallbackTeamMembers.map((member) => ({
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: normalizeMediaUrl(member.image),
  }));
}

export const getPublishedAboutTeamMembers = cache(async (): Promise<AboutTeamMember[]> => {
  if (!isDatabaseConfigured()) return fallbackMembers();

  try {
    const sql = getSql();
    const rows = await sql`
      select * from public.about_team_members
      where status = 'published'
      order by sort_order asc, updated_at desc
    `;

    if (!rows.length) return fallbackMembers();
    return rows.map((row) => toPublicMember(rowToMember(row)));
  } catch {
    return fallbackMembers();
  }
});

export async function listAdminAboutTeamMembers(): Promise<AdminAboutTeamMember[]> {
  const sql = getSql();
  try {
    const rows = await sql`
      select * from public.about_team_members
      order by sort_order asc, updated_at desc
    `;
    return rows.map((row) => rowToMember(row));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function seedDefaultAboutTeamMembersIfEmpty(): Promise<number> {
  const sql = getSql();

  try {
    const countRows = await sql<{ count: string }[]>`
      select count(*)::text as count from public.about_team_members
    `;
    const count = Number(countRows[0]?.count ?? 0);
    if (count > 0) return 0;

    for (const [index, member] of fallbackTeamMembers.entries()) {
      await sql`
        insert into public.about_team_members (
          id, name, role, bio, image, sort_order, status
        ) values (
          ${DEFAULT_ABOUT_TEAM_MEMBER_IDS[index] ?? null}::uuid,
          ${member.name},
          ${member.role},
          ${member.bio},
          ${member.image},
          ${index + 1},
          'published'
        )
        on conflict (id) do update set
          name = excluded.name,
          role = excluded.role,
          bio = excluded.bio,
          image = excluded.image,
          sort_order = excluded.sort_order,
          status = excluded.status,
          updated_at = now()
      `;
    }

    return fallbackTeamMembers.length;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function getAdminAboutTeamMember(id: string): Promise<AdminAboutTeamMember | null> {
  const sql = getSql();
  try {
    const rows = await sql`
      select * from public.about_team_members where id = ${id}::uuid limit 1
    `;
    return rows[0] ? rowToMember(rows[0]) : null;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

function memberToRow(input: AboutTeamMemberInput) {
  return {
    name: input.name.trim(),
    role: input.role.trim(),
    bio: input.bio.trim(),
    image: input.image.trim(),
    sort_order: input.sortOrder,
    status: input.status,
  };
}

export async function saveAboutTeamMember(
  input: AboutTeamMemberInput,
  options: { id?: string },
): Promise<string> {
  const sql = getSql();
  const row = memberToRow(input);

  try {
    if (options.id) {
      await sql`
        update public.about_team_members
        set
          name = ${row.name},
          role = ${row.role},
          bio = ${row.bio},
          image = ${row.image},
          sort_order = ${row.sort_order},
          status = ${row.status},
          updated_at = now()
        where id = ${options.id}::uuid
      `;
      return options.id;
    }

    const rows = await sql<{ id: string }[]>`
      insert into public.about_team_members (
        name, role, bio, image, sort_order, status
      ) values (
        ${row.name},
        ${row.role},
        ${row.bio},
        ${row.image},
        ${row.sort_order},
        ${row.status}
      )
      returning id
    `;
    return rows[0].id;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function deleteAboutTeamMember(id: string) {
  const sql = getSql();
  try {
    await sql`delete from public.about_team_members where id = ${id}::uuid`;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function updateAboutTeamMemberStatus(id: string, status: ContentStatus) {
  const sql = getSql();
  try {
    await sql`
      update public.about_team_members
      set status = ${status}, updated_at = now()
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}
