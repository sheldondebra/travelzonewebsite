import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNotice, AdminPageHeader } from "@/components/admin/AdminChrome";
import { BlogForm } from "@/components/admin/BlogForm";
import { DeleteBlogButton } from "@/components/admin/DeleteBlogButton";
import { getAdminBlogPost } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditBlogPage({ params, searchParams }: Props) {
  const { role } = await requireStaff();
  const { id } = await params;
  const { saved } = await searchParams;
  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return (
    <>
      <AdminPageHeader
        title="Edit post"
        description={post.title}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {post.status === "published" ? (
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="admin-button-secondary"
              >
                View post
              </Link>
            ) : null}
            <Link href="/admin/blog" className="admin-button-secondary">
              Back to posts
            </Link>
          </div>
        }
      />

      {saved ? <AdminNotice variant="success">Post updated.</AdminNotice> : null}

      <BlogForm post={post} />

      {role === "admin" ? (
        <div className="admin-postbox mt-5">
          <div className="admin-postbox-header">
            <h2>Delete post</h2>
          </div>
          <div className="admin-postbox-body">
            <p className="m-0 text-[13px] text-[#646970]">
              Permanently remove this post from the site. This action cannot be undone.
            </p>
            <div className="mt-3">
              <DeleteBlogButton id={post.id} title={post.title} redirectOnDelete />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
