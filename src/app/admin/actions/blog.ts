"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteBlogPost,
  saveBlogPost,
  updateBlogPostStatus,
} from "@/lib/content-admin";
import type { BlogPostInput, ContentStatus } from "@/lib/content-types";
import { normalizeMediaUrl } from "@/lib/media-url";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type BlogActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

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
    bodyHtml: sanitizeBlogHtml(String(formData.get("bodyHtml") ?? "")),
    image: normalizeMediaUrl(String(formData.get("image") ?? "")),
    category: String(formData.get("category") ?? ""),
    readTime: String(formData.get("readTime") ?? "5 min read"),
    date: String(formData.get("date") ?? ""),
    status: (formData.get("status") as ContentStatus) ?? "draft",
  };
}

export async function saveBlogPostAction(
  _prev: { success: false; error: string } | undefined,
  formData: FormData,
) {
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

export async function updateBlogPostStatusAction(
  _prev: BlogActionResult | undefined,
  formData: FormData,
): Promise<BlogActionResult> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatus;

  if (!id) {
    return { success: false, error: "Post not found." };
  }

  if (status !== "draft" && status !== "published") {
    return { success: false, error: "Invalid status." };
  }

  try {
    await updateBlogPostStatus(id, status);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    return {
      success: true,
      message: status === "published" ? "Post published." : "Post switched to draft.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update post.",
    };
  }
}

export async function deleteBlogPostFormAction(
  _prev: BlogActionResult | undefined,
  formData: FormData,
): Promise<BlogActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { success: false, error: "Post not found." };
  }

  try {
    await deleteBlogPost(id);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    return { success: true, message: "Post deleted." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete post.",
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
