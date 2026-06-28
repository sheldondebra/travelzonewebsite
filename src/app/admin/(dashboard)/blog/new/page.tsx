import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <>
      <AdminPageHeader title="Add New Post" />
      <BlogForm />
    </>
  );
}
