import { notFound } from "next/navigation";
import { DeleteBlogButton } from "@/components/admin/DeleteBlogButton";
import { AdminNotice, AdminPageHeader } from "@/components/admin/AdminChrome";
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
    <>
      <AdminPageHeader
        title="Edit Post"
        actions={<DeleteBlogButton id={id} />}
      />
      {saved ? (
        <AdminNotice variant="success">Post saved.</AdminNotice>
      ) : null}
      <BlogForm post={post} />
    </>
  );
}
