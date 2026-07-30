import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { HeroSliderEditor } from "@/components/admin/HeroSliderEditor";
import {
  listAdminHeroSlides,
  seedDefaultHeroSlidesIfEmpty,
} from "@/lib/hero-slides-store";
import { requireAdmin } from "@/lib/auth/staff";

export default async function AdminHeroPage() {
  await requireAdmin();

  let slides = await listAdminHeroSlides();
  if (slides.length === 0) {
    try {
      await seedDefaultHeroSlidesIfEmpty();
      slides = await listAdminHeroSlides();
    } catch {
      // Table may not exist yet — editor shows import guidance.
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Hero slider"
        description="Manage homepage slider images, headlines, body copy, and CTAs. Each slide can have its own content."
        actions={
          <Link href="/#home" target="_blank" className="admin-button-secondary">
            View homepage hero
          </Link>
        }
      />
      <HeroSliderEditor
        key={slides.map((slide) => `${slide.id}:${slide.updatedAt}`).join("|") || "empty"}
        slides={slides}
      />
    </>
  );
}
