import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { BlogList } from "@/components/admin/BlogList";
import { listAdminBlogPosts } from "@/lib/content-admin";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminBlogPage() {
  await requireStaff();
  const posts = await listAdminBlogPosts();

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
      <BlogList posts={posts} />
    </>
  );
}
