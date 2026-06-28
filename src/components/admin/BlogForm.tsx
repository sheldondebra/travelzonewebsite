"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveBlogPostAction } from "@/app/admin/actions/blog";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminBlogPost, ContentStatus } from "@/lib/content-types";

type Props = {
  post?: AdminBlogPost;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function BlogForm({ post }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [bodyHtml, setBodyHtml] = useState(
    post?.bodyHtml ?? post?.content?.map((p) => `<p>${p}</p>`).join("") ?? "",
  );
  const [image, setImage] = useState(post?.image ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [readTime, setReadTime] = useState(post?.readTime ?? "5 min read");
  const [date, setDate] = useState(
    post?.date ??
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
  );
  const [status, setStatus] = useState<ContentStatus>(post?.status ?? "draft");

  const uploadFolder = useMemo(() => `blog/${slug || "draft"}`, [slug]);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await saveBlogPostAction(formData);
          if (result && !result.success) setError(result.error);
        });
      }}
      className="admin-editor-layout"
    >
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="bodyHtml" value={bodyHtml} />

      <div className="admin-editor-main space-y-5">
        {error ? <AdminNotice variant="error">{error}</AdminNotice> : null}

        <AdminWidget title="Post details">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="admin-label">
                Title
              </label>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!post) setSlug(slugify(e.target.value));
                }}
                required
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="slug" className="admin-label">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                required
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="excerpt" className="admin-label">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Content">
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
        </AdminWidget>

        <AdminWidget title="Featured image">
          <ImageUpload
            label="Featured image"
            value={image}
            folder={uploadFolder}
            onChange={setImage}
          />
          <input type="hidden" name="image" value={image} />
        </AdminWidget>

        <AdminWidget title="Meta">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="category" className="admin-label">
                Category
              </label>
              <input
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="readTime" className="admin-label">
                Read time
              </label>
              <input
                id="readTime"
                name="readTime"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="date" className="admin-label">
                Display date
              </label>
              <input
                id="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>
      </div>

      <div className="admin-editor-sidebar space-y-5">
        <AdminWidget title="Publish">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#646970]">Status</span>
              <StatusBadge status={status} />
            </div>

            <div>
              <label htmlFor="status" className="admin-label">
                Visibility
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="admin-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#f0f0f1] pt-3">
              <button type="submit" disabled={pending} className="admin-button-primary">
                {pending
                  ? "Saving…"
                  : status === "published"
                    ? post
                      ? "Update"
                      : "Publish"
                    : "Save draft"}
              </button>
              {post && status === "published" && slug ? (
                <Link
                  href={`/blog/${slug}`}
                  target="_blank"
                  className="admin-button-secondary"
                >
                  Preview
                </Link>
              ) : null}
            </div>
          </div>
        </AdminWidget>
      </div>
    </form>
  );
}
