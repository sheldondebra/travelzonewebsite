import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <div>
      <h1 className="heading-serif mb-6 text-2xl text-navy">New blog post</h1>
      <BlogForm />
    </div>
  );
}
