import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { listAdminBlogPosts } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminBlogPage() {
  await requireStaff();
  const posts = await listAdminBlogPosts();
  const published = posts.filter((post) => post.status === "published").length;
  const drafts = posts.filter((post) => post.status === "draft").length;

  return (
    <>
      <AdminPageHeader
        title="Posts"
        actions={
          <Link href="/admin/blog/new" className="admin-button-primary">
            Add New
          </Link>
        }
      />

      <ul className="admin-subsubsub">
        <li>
          <span className="current">All ({posts.length})</span>
        </li>
        <li>
          <span>Published ({published})</span>
        </li>
        <li>
          <span>Draft ({drafts})</span>
        </li>
      </ul>

      <div className="admin-postbox overflow-hidden p-0">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-[#646970]">
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link href={`/admin/blog/${post.id}/edit`} className="admin-row-title">
                      {post.title}
                    </Link>
                    <div className="admin-row-actions">
                      <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
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
    </>
  );
}
