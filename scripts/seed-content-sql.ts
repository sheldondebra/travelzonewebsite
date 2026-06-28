import postgres from "postgres";
import {
  paragraphsToHtml,
  staticBlogPosts,
  staticTours,
} from "@/lib/seed-data";
import { getDatabaseUrl } from "./db-url";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

async function seedContent() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or SUPABASE_DB_PASSWORD is required.");
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const publishedAt = new Date().toISOString();

  try {
    for (const tour of staticTours) {
      await sql`
        insert into public.tours (
          slug, title, tagline, location, duration, price, currency,
          price_note, travel_period, image, gallery, description,
          overview, highlights, included, category, status, published_at
        ) values (
          ${tour.slug},
          ${tour.title},
          ${tour.tagline},
          ${tour.location},
          ${tour.duration},
          ${tour.price},
          ${tour.currency},
          ${tour.priceNote},
          ${tour.travelPeriod},
          ${tour.image},
          ${sql.json(tour.gallery)},
          ${tour.description},
          ${sql.json(tour.overview)},
          ${sql.json(tour.highlights)},
          ${sql.json(tour.included)},
          ${tour.category},
          'published',
          ${publishedAt}
        )
        on conflict (slug) do update set
          title = excluded.title,
          tagline = excluded.tagline,
          location = excluded.location,
          duration = excluded.duration,
          price = excluded.price,
          currency = excluded.currency,
          price_note = excluded.price_note,
          travel_period = excluded.travel_period,
          image = excluded.image,
          gallery = excluded.gallery,
          description = excluded.description,
          overview = excluded.overview,
          highlights = excluded.highlights,
          included = excluded.included,
          category = excluded.category,
          status = excluded.status,
          published_at = excluded.published_at,
          updated_at = now()
      `;
    }

    for (const post of staticBlogPosts) {
      await sql`
        insert into public.blog_posts (
          slug, title, excerpt, body_html, image, category,
          read_time, display_date, status, published_at
        ) values (
          ${post.slug},
          ${post.title},
          ${post.excerpt},
          ${paragraphsToHtml(post.content)},
          ${post.image},
          ${post.category},
          ${post.readTime},
          ${post.date},
          'published',
          ${publishedAt}
        )
        on conflict (slug) do update set
          title = excluded.title,
          excerpt = excluded.excerpt,
          body_html = excluded.body_html,
          image = excluded.image,
          category = excluded.category,
          read_time = excluded.read_time,
          display_date = excluded.display_date,
          status = excluded.status,
          published_at = excluded.published_at,
          updated_at = now()
      `;
    }

    console.log(
      `Seeded ${staticTours.length} tours and ${staticBlogPosts.length} blog posts.`,
    );
  } finally {
    await sql.end();
  }
}

seedContent().catch((error) => {
  console.error(error);
  process.exit(1);
});
