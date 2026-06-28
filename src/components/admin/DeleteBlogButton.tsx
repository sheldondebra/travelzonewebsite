import { deleteBlogPostAction } from "@/app/admin/actions/blog";
import { requireStaff } from "@/lib/supabase/auth";

export async function DeleteBlogButton({ id }: { id: string }) {
  const staff = await requireStaff();
  if (staff.role !== "admin") return null;

  return (
    <form action={deleteBlogPostAction.bind(null, id)}>
      <button
        type="submit"
        className="text-sm font-semibold text-brand-red hover:underline"
      >
        Delete
      </button>
    </form>
  );
}
