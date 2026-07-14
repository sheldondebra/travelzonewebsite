"use client";

import { useMemo, useState, useTransition } from "react";
import { saveBlogPostAction } from "@/app/admin/actions/blog";
import type { AdminBlogPost, ContentStatus } from "@/lib/content-types";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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
    post?.date ?? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
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
      className="admin-card space-y-6"
    >
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <input type="hidden" name="bodyHtml" value={bodyHtml} />

      {error ? (
        <p className="rounded-lg bg-card-pink px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
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

      <div>
        <label className="admin-label">Body</label>
        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
      </div>

      <ImageUpload
        label="Featured image"
        value={image}
        folder={uploadFolder}
        onChange={setImage}
      />
      <input type="hidden" name="image" value={image} />

      <div className="grid gap-5 md:grid-cols-3">
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

      <div>
        <label htmlFor="status" className="admin-label">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContentStatus)}
          className="admin-input max-w-xs"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save post"}
      </button>
    </form>
  );
}
