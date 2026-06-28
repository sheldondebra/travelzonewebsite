"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminBlogPost, ContentStatus } from "@/lib/content-types";

type Props = {
  posts: AdminBlogPost[];
};

type Filter = "all" | ContentStatus;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
];

export function BlogList({ posts }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesFilter = filter === "all" || post.status === filter;
      const haystack = `${post.title} ${post.slug} ${post.category}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [posts, filter, query]);

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ul className="admin-subsubsub">
          {filters.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={filter === item.id ? "current" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label} (
                {item.id === "all"
                  ? posts.length
                  : posts.filter((post) => post.status === item.id).length}
                )
              </button>
            </li>
          ))}
        </ul>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search posts"
          className="admin-input w-full sm:max-w-xs"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-[#646970]">
                    No posts match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/admin/blog/${post.id}/edit`} className="admin-row-title">
                        {post.title}
                      </Link>
                      <div className="admin-row-actions">
                        <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
                        {post.status === "published" ? (
                          <>
                            <span aria-hidden> | </span>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              View
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="text-[#646970]">
                      {new Date(post.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
