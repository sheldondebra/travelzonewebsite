import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <>
      <AdminPageHeader
        title="New post"
        description="Add the essentials now — read time and display date can follow."
        actions={
          <Link href="/admin/blog" className="admin-button-secondary">
            All posts
          </Link>
        }
      />
      <BlogForm />
    </>
  );
}
