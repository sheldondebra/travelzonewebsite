import { createAdminClient } from "@/lib/supabase/admin";
import {
  paragraphsToHtml,
  staticBlogPosts,
  staticTours,
} from "@/lib/seed-data";
import { loadLocalEnv } from "./load-env";
import { resolveBlogImageUrl } from "./upload-blog-images";

loadLocalEnv();

async function seed() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing in .env.local: ${missing.join(", ")}. Get them from Supabase → Project Settings → API (service_role is under "Project API keys").`,
    );
  }

  const supabase = createAdminClient();

  for (const tour of staticTours) {
    const { error } = await supabase.from("tours").upsert(
      {
        slug: tour.slug,
        title: tour.title,
        tagline: tour.tagline,
        location: tour.location,
        duration: tour.duration,
        price: tour.price,
        currency: tour.currency,
        price_note: tour.priceNote,
        travel_period: tour.travelPeriod,
        image: tour.image,
        gallery: tour.gallery,
        description: tour.description,
        overview: tour.overview,
        highlights: tour.highlights,
        included: tour.included,
        category: tour.category,
        status: "published",
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) {
      if (error.message.includes("Could not find the table")) {
        throw new Error(
          `Table missing (${error.message}). Run database setup first:\n` +
            `  • Open https://supabase.com/dashboard/project/xdegzidfeccjeajedxes/sql/new\n` +
            `  • Paste and run supabase/setup-all.sql\n` +
            `  • Then run: npm run seed`,
        );
      }
      throw new Error(`Tour ${tour.slug}: ${error.message}`);
    }
  }

  for (const post of staticBlogPosts) {
    const image = await resolveBlogImageUrl(post.image);
    const { error } = await supabase.from("blog_posts").upsert(
      {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body_html: paragraphsToHtml(post.content),
        image,
        category: post.category,
        read_time: post.readTime,
        display_date: post.date,
        status: "published",
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(`Blog ${post.slug}: ${error.message}`);
  }

  console.log(
    `Seeded ${staticTours.length} tours and ${staticBlogPosts.length} blog posts.`,
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
