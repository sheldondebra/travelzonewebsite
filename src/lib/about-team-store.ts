import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { cache } from "react";
import type {
  AboutTeamMember,
  AboutTeamMemberInput,
  AdminAboutTeamMember,
} from "@/lib/about-team";
import { teamMembers as fallbackTeamMembers } from "@/lib/content";
import type { ContentStatus } from "@/lib/content-types";
import { normalizeMediaUrl } from "@/lib/media-url";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/db-errors";

const DEFAULT_ABOUT_TEAM_MEMBER_IDS = [
  "a1111111-1111-4111-8111-111111111101",
  "a1111111-1111-4111-8111-111111111102",
  "a1111111-1111-4111-8111-111111111103",
] as const;

function databaseSetupError() {
  return new Error(
    "About team table is missing. Run supabase/migrations/20260628140000_about_team_members.sql in the Supabase SQL Editor.",
  );
}

function anonClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase not configured");
  return createSupabaseJs(env.url, env.anonKey);
}

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
  if (!isSupabaseConfigured()) return fallbackMembers();

  const { data, error } = await anonClient()
    .from("about_team_members")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return fallbackMembers();
    throw new Error(error.message);
  }

  if (!data?.length) return fallbackMembers();
  return data.map((row) => toPublicMember(rowToMember(row)));
});

export async function listAdminAboutTeamMembers(): Promise<AdminAboutTeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("about_team_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => rowToMember(row));
}

/** Import the default About page team into the database when empty. */
export async function seedDefaultAboutTeamMembersIfEmpty(): Promise<number> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("about_team_members")
    .select("*", { count: "exact", head: true });

  if (countError) {
    if (isMissingTableError(countError)) throw databaseSetupError();
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) return 0;

  const rows = fallbackTeamMembers.map((member, index) => ({
    id: DEFAULT_ABOUT_TEAM_MEMBER_IDS[index] ?? undefined,
    name: member.name,
    role: member.role,
    bio: member.bio,
    image: member.image,
    sort_order: index + 1,
    status: "published" as const,
  }));

  const { error } = await supabase.from("about_team_members").upsert(rows, { onConflict: "id" });
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }

  return rows.length;
}

export async function getAdminAboutTeamMember(id: string): Promise<AdminAboutTeamMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("about_team_members")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }

  return data ? rowToMember(data) : null;
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
  const supabase = await createClient();
  const row = memberToRow(input);

  if (options.id) {
    const { error } = await supabase
      .from("about_team_members")
      .update(row)
      .eq("id", options.id);
    if (error) {
      if (isMissingTableError(error)) throw databaseSetupError();
      throw new Error(error.message);
    }
    return options.id;
  }

  const { data, error } = await supabase
    .from("about_team_members")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function deleteAboutTeamMember(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("about_team_members").delete().eq("id", id);
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
}

export async function updateAboutTeamMemberStatus(id: string, status: ContentStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("about_team_members")
    .update({ status })
    .eq("id", id);
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
}
