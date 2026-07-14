import { notFound } from "next/navigation";
import { DeleteBlogButton } from "@/components/admin/DeleteBlogButton";
import { BlogForm } from "@/components/admin/BlogForm";
import { getAdminBlogPost } from "@/lib/content-admin";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditBlogPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { saved } = await searchParams;
  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="heading-serif text-2xl text-navy">Edit blog post</h1>
          {saved ? (
            <p className="mt-1 text-sm text-accent-green">Post saved.</p>
          ) : null}
        </div>
        <DeleteBlogButton id={id} />
      </div>
      <BlogForm post={post} />
    </div>
  );
}
