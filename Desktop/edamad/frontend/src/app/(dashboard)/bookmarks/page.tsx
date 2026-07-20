import { PageHeader } from "@/components/edamad/page-header";

export default function BookmarksPage() {
  return (
    <div>
      <PageHeader title="Bookmarks" description="Saved questions, lessons, and courses." />
      <div className="ed-card p-8 text-center text-[#6B7280]">No bookmarks yet. Bookmark questions during practice tests.</div>
    </div>
  );
}
