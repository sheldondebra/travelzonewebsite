"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteBlogPost,
  saveBlogPost,
} from "@/lib/content-admin";
import type { BlogPostInput, ContentStatus } from "@/lib/content-types";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBlogForm(formData: FormData): BlogPostInput {
  return {
    slug: slugify(String(formData.get("slug") ?? "")),
    title: String(formData.get("title") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    bodyHtml: String(formData.get("bodyHtml") ?? ""),
    image: String(formData.get("image") ?? ""),
    category: String(formData.get("category") ?? ""),
    readTime: String(formData.get("readTime") ?? "5 min read"),
    date: String(formData.get("date") ?? ""),
    status: (formData.get("status") as ContentStatus) ?? "draft",
  };
}

export async function saveBlogPostAction(formData: FormData) {
  const { user } = await requireStaff();
  const id = String(formData.get("id") ?? "") || undefined;
  const post = parseBlogForm(formData);

  if (!post.slug || !post.title) {
    return { success: false as const, error: "Title and slug are required." };
  }

  try {
    const savedId = await saveBlogPost(post, {
      id,
      authorId: user.id,
    });
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/blog");
    redirect(`/admin/blog/${savedId}/edit?saved=1`);
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not save post.",
    };
  }
}

export async function deleteBlogPostAction(id: string) {
  await requireAdmin();

  await deleteBlogPost(id);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
