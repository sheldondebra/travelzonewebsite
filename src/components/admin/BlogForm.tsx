"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveBlogPostAction } from "@/app/admin/actions/blog";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminBlogPost, ContentStatus } from "@/lib/content-types";
import { slugify } from "@/lib/slugify";

type Props = {
  post?: AdminBlogPost;
};

function defaultDisplayDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function hasDisplayOptions(readTime: string, date: string, baselineDate: string) {
  return Boolean(
    (readTime.trim() && readTime !== "5 min read") ||
      (date.trim() && date !== baselineDate),
  );
}

export function BlogForm({ post }: Props) {
  const isNew = !post;
  const baselineDate = useMemo(() => defaultDisplayDate(), []);
  const [state, formAction, pending] = useActionState(saveBlogPostAction, undefined);

  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [bodyHtml, setBodyHtml] = useState(
    post?.bodyHtml ?? post?.content?.map((p) => `<p>${p}</p>`).join("") ?? "",
  );
  const [image, setImage] = useState(post?.image ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [readTime, setReadTime] = useState(post?.readTime ?? "5 min read");
  const [date, setDate] = useState(post?.date ?? baselineDate);
  const [status, setStatus] = useState<ContentStatus>(post?.status ?? "draft");
  const [showDisplayOptions, setShowDisplayOptions] = useState(() =>
    isNew
      ? false
      : hasDisplayOptions(post?.readTime ?? "5 min read", post?.date ?? baselineDate, baselineDate),
  );

  const slug = useMemo(() => slugify(title) || "post", [title]);
  const uploadFolder = useMemo(() => `blog/${slug}`, [slug]);

  return (
    <form action={formAction} className="admin-editor-layout admin-tour-form">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="bodyHtml" value={bodyHtml} />
      <input type="hidden" name="image" value={image} />

      <div className="admin-editor-main space-y-4">
        {state && !state.success ? (
          <AdminNotice variant="error">{state.error}</AdminNotice>
        ) : null}

        <AdminWidget title="Basics">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="admin-label">
                Title
              </label>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                autoFocus={isNew}
                placeholder="Best time to visit Cape Coast Castle"
                className="admin-input admin-input-title"
              />
              <p className="admin-field-hint">travelzonegh.com/blog/{slug}</p>
            </div>

            <div>
              <label htmlFor="excerpt" className="admin-label">
                Summary
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="A short teaser for cards and search results"
                className="admin-input"
              />
            </div>

            <div>
              <label htmlFor="category" className="admin-label">
                Category
              </label>
              <input
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Travel tips"
                className="admin-input"
              />
            </div>
          </div>
        </AdminWidget>

        <AdminWidget title="Content">
          <p className="admin-field-hint mb-3 mt-0">
            Write the full article. Use headings and lists to break up long sections.
          </p>
          <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
        </AdminWidget>

        <AdminWidget title="Cover photo">
          <ImageUpload
            label="Featured image"
            value={image}
            folder={uploadFolder}
            onChange={setImage}
          />
        </AdminWidget>

        {!showDisplayOptions ? (
          <button
            type="button"
            className="admin-tour-extras-toggle"
            onClick={() => setShowDisplayOptions(true)}
          >
            + Adjust read time & display date (optional)
          </button>
        ) : (
          <AdminWidget title="Display options">
            <div className="admin-form-grid-2">
              <div>
                <label htmlFor="readTime" className="admin-label">
                  Read time
                </label>
                <input
                  id="readTime"
                  name="readTime"
                  value={readTime}
                  onChange={(event) => setReadTime(event.target.value)}
                  placeholder="5 min read"
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
                  onChange={(event) => setDate(event.target.value)}
                  placeholder={baselineDate}
                  className="admin-input"
                />
                <p className="admin-field-hint">Shown on the blog card and post header</p>
              </div>
            </div>
          </AdminWidget>
        )}

        {!showDisplayOptions ? (
          <>
            <input type="hidden" name="readTime" value={readTime} />
            <input type="hidden" name="date" value={date} />
          </>
        ) : null}
      </div>

      <div className="admin-editor-sidebar">
        <div className="admin-tour-sidebar-sticky space-y-4">
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
                  onChange={(event) => setStatus(event.target.value as ContentStatus)}
                  className="admin-input"
                >
                  <option value="draft">Draft — hidden from site</option>
                  <option value="published">Published — live on site</option>
                </select>
              </div>

              {isNew ? (
                <p className="admin-field-hint m-0">
                  Save as draft first if you want to review before going live.
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-[#f0f0f1] pt-3">
                <button type="submit" disabled={pending} className="admin-login-submit">
                  {pending
                    ? "Saving…"
                    : status === "published"
                      ? post
                        ? "Update post"
                        : "Publish post"
                      : isNew
                        ? "Save draft"
                        : "Save changes"}
                </button>
                {post && status === "published" && slug ? (
                  <Link
                    href={`/blog/${slug}`}
                    target="_blank"
                    className="admin-button-secondary justify-center"
                  >
                    Preview live page
                  </Link>
                ) : null}
                <Link href="/admin/blog" className="admin-button-secondary justify-center">
                  Cancel
                </Link>
              </div>
            </div>
          </AdminWidget>
        </div>
      </div>
    </form>
  );
}
