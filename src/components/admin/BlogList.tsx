"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteBlogPostFormAction,
  updateBlogPostStatusAction,
  type BlogActionResult,
} from "@/app/admin/actions/blog";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminBlogPost, ContentStatus } from "@/lib/content-types";
import type { StaffRole } from "@/lib/supabase/auth";

type Filter = "all" | ContentStatus;

type Props = {
  posts: AdminBlogPost[];
  role: StaffRole;
};

function PostThumbnail({ post }: { post: AdminBlogPost }) {
  if (!post.image) {
    return (
      <span className="admin-tour-thumb-empty" aria-hidden>
        {post.title.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={post.image}
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 object-cover"
      unoptimized={
        !post.image.includes("supabase.co") && !post.image.includes("unsplash.com")
      }
    />
  );
}

function PostRow({
  post,
  role,
  onActionResult,
}: {
  post: AdminBlogPost;
  role: StaffRole;
  onActionResult: (result: BlogActionResult) => void;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateBlogPostStatusAction,
    undefined,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBlogPostFormAction,
    undefined,
  );

  useEffect(() => {
    if (statusState) onActionResult(statusState);
  }, [statusState, onActionResult]);

  useEffect(() => {
    if (deleteState) onActionResult(deleteState);
  }, [deleteState, onActionResult]);

  const nextStatus = post.status === "published" ? "draft" : "published";
  const statusLabel = post.status === "published" ? "Unpublish" : "Publish";

  return (
    <tr>
      <td className="w-14">
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className="admin-tour-thumb"
          aria-label={`Edit ${post.title}`}
        >
          <PostThumbnail post={post} />
        </Link>
      </td>
      <td className="min-w-[220px]">
        <Link href={`/admin/blog/${post.id}/edit`} className="admin-row-title">
          {post.title}
        </Link>
        {post.excerpt ? (
          <p className="mt-0.5 line-clamp-1 text-[12px] text-[#646970]">{post.excerpt}</p>
        ) : null}
      </td>
      <td className="hidden text-[#646970] md:table-cell">{post.category || "—"}</td>
      <td>
        <StatusBadge status={post.status} />
      </td>
      <td className="hidden text-[#646970] lg:table-cell">{post.date || "—"}</td>
      <td className="hidden text-[#646970] sm:table-cell">
        {new Date(post.updatedAt).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="min-w-[180px]">
        <div className="admin-row-actions flex flex-wrap items-center gap-x-1 gap-y-1">
          <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
          {post.status === "published" ? (
            <>
              <span aria-hidden>|</span>
              <Link href={`/blog/${post.slug}`} target="_blank">
                View
              </Link>
            </>
          ) : null}
          <span aria-hidden>|</span>
          <form action={statusAction} className="inline">
            <input type="hidden" name="id" value={post.id} />
            <input type="hidden" name="status" value={nextStatus} />
            <button
              type="submit"
              disabled={statusPending || deletePending}
              className="admin-row-action-link"
            >
              {statusPending ? "Saving…" : statusLabel}
            </button>
          </form>
          {role === "admin" ? (
            <>
              <span aria-hidden>|</span>
              <form
                action={deleteAction}
                className="inline"
                onSubmit={(event) => {
                  if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={post.id} />
                <button
                  type="submit"
                  disabled={statusPending || deletePending}
                  className="admin-row-action-delete inline"
                >
                  {deletePending ? "Deleting…" : "Delete"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function BlogList({ posts, role }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<BlogActionResult | null>(null);

  const published = posts.filter((post) => post.status === "published").length;
  const drafts = posts.filter((post) => post.status === "draft").length;

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter === "published" && post.status !== "published") return false;
      if (filter === "draft" && post.status !== "draft") return false;
      if (!search) return true;
      const haystack = `${post.title} ${post.slug} ${post.category} ${post.excerpt}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [filter, posts, query]);

  const handleActionResult = useMemo(
    () => (result: BlogActionResult) => {
      setFeedback(result);
      if (result.success) {
        router.refresh();
      }
    },
    [router],
  );

  return (
    <>
      {feedback ? (
        <AdminNotice variant={feedback.success ? "success" : "error"}>
          <div className="flex items-start justify-between gap-3">
            <span>{feedback.success ? feedback.message : feedback.error}</span>
            <button
              type="button"
              className="admin-row-action-link shrink-0"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        </AdminNotice>
      ) : null}

      <div className="admin-tours-stats">
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{posts.length}</span>
          <span className="admin-tours-stat-label">Total posts</span>
        </div>
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{published}</span>
          <span className="admin-tours-stat-label">Published</span>
        </div>
        <div className="admin-tours-stat">
          <span className="admin-tours-stat-value">{drafts}</span>
          <span className="admin-tours-stat-label">Drafts</span>
        </div>
      </div>

      <div className="admin-tours-toolbar">
        <ul className="admin-subsubsub">
          <li>
            <button
              type="button"
              className={filter === "all" ? "current" : ""}
              onClick={() => setFilter("all")}
            >
              All ({posts.length})
            </button>
          </li>
          <li>
            <button
              type="button"
              className={filter === "published" ? "current" : ""}
              onClick={() => setFilter("published")}
            >
              Published ({published})
            </button>
          </li>
          <li>
            <button
              type="button"
              className={filter === "draft" ? "current" : ""}
              onClick={() => setFilter("draft")}
            >
              Draft ({drafts})
            </button>
          </li>
        </ul>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, category, slug…"
          className="admin-input w-full sm:max-w-xs"
          aria-label="Search posts"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table admin-tours-table">
            <thead>
              <tr>
                <th className="w-14" aria-label="Image" />
                <th>Title</th>
                <th className="hidden md:table-cell">Category</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Display date</th>
                <th className="hidden sm:table-cell">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#646970]">
                    {posts.length === 0 ? (
                      <div className="space-y-3">
                        <p>No posts yet. Write your first travel guide or tip.</p>
                        <Link href="/admin/blog/new" className="admin-button-primary">
                          Write a post
                        </Link>
                      </div>
                    ) : (
                      "No posts match your search or filter."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <PostRow
                    key={post.id}
                    post={post}
                    role={role}
                    onActionResult={handleActionResult}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
