import { createClient } from "@/lib/supabase/server";
import { databaseSetupError, isMissingTableError } from "@/lib/supabase/db-errors";
import type { Tour } from "@/lib/tours";
import { htmlToParagraphs } from "@/lib/content-public";
import type {
  AdminBlogPost,
  AdminTour,
  BlogPostInput,
  ContentStatus,
  TourInput,
} from "@/lib/content-types";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  return [];
}

function rowToTour(row: Record<string, unknown>): Tour {
  return {
    slug: row.slug as string,
    title: row.title as string,
    tagline: (row.tagline as string) ?? "",
    location: (row.location as string) ?? "",
    duration: (row.duration as string) ?? "",
    price: Number(row.price),
    currency: (row.currency as "USD" | "GHS") ?? "USD",
    priceNote: (row.price_note as string) ?? "",
    travelPeriod: (row.travel_period as string) ?? "",
    image: (row.image as string) ?? "",
    gallery: asStringArray(row.gallery),
    description: (row.description as string) ?? "",
    overview: asStringArray(row.overview),
    highlights: asStringArray(row.highlights),
    included: asStringArray(row.included),
    category: (row.category as string) ?? "",
  };
}

function rowToAdminTour(row: Record<string, unknown>): AdminTour {
  return {
    ...rowToTour(row),
    id: row.id as string,
    status: row.status as ContentStatus,
    updatedAt: row.updated_at as string,
  };
}

function rowToAdminBlogPost(row: Record<string, unknown>): AdminBlogPost {
  const bodyHtml = (row.body_html as string) ?? "";
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    bodyHtml,
    content: htmlToParagraphs(bodyHtml),
    image: (row.image as string) ?? "",
    date: (row.display_date as string) ?? "",
    category: (row.category as string) ?? "",
    readTime: (row.read_time as string) ?? "5 min read",
    id: row.id as string,
    status: row.status as ContentStatus,
    updatedAt: row.updated_at as string,
  };
}

function tourToRow(
  tour: TourInput,
  authorId: string | null,
  publishedAt?: string | null,
) {
  return {
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
    status: tour.status,
    author_id: authorId,
    published_at:
      tour.status === "published"
        ? (publishedAt ?? new Date().toISOString())
        : null,
  };
}

function blogToRow(
  post: BlogPostInput,
  authorId: string | null,
  publishedAt?: string | null,
) {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body_html: post.bodyHtml,
    image: post.image,
    category: post.category,
    read_time: post.readTime,
    display_date: post.date,
    status: post.status,
    author_id: authorId,
    published_at:
      post.status === "published"
        ? (publishedAt ?? new Date().toISOString())
        : null,
  };
}

export async function listAdminTours(): Promise<AdminTour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => rowToAdminTour(row));
}

export async function getAdminTour(id: string): Promise<AdminTour | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? rowToAdminTour(data) : null;
}

export async function saveTour(
  input: TourInput,
  options: { id?: string; authorId: string },
) {
  const supabase = await createClient();
  const row = tourToRow(input, options.authorId);

  if (options.id) {
    const { error } = await supabase
      .from("tours")
      .update(row)
      .eq("id", options.id);
    if (error) {
      if (isMissingTableError(error)) throw databaseSetupError();
      throw new Error(error.message);
    }
    return options.id;
  }

  const { data, error } = await supabase
    .from("tours")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function deleteTour(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tours").delete().eq("id", id);
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
}

export async function updateTourStatus(id: string, status: ContentStatus) {
  const supabase = await createClient();
  const payload: { status: ContentStatus; published_at?: string } = { status };

  if (status === "published") {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("tours").update(payload).eq("id", id);
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
}

export async function listAdminBlogPosts(): Promise<AdminBlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => rowToAdminBlogPost(row));
}

export async function getAdminBlogPost(id: string): Promise<AdminBlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw new Error(error.message);
  }
  return data ? rowToAdminBlogPost(data) : null;
}

export async function saveBlogPost(
  input: BlogPostInput,
  options: { id?: string; authorId: string },
) {
  const supabase = await createClient();
  const row = blogToRow(input, options.authorId);

  if (options.id) {
    const { error } = await supabase
      .from("blog_posts")
      .update(row)
      .eq("id", options.id);
    if (error) {
      if (isMissingTableError(error)) throw databaseSetupError();
      throw new Error(error.message);
    }
    return options.id;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
  return data.id as string;
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw new Error(error.message);
  }
}

export async function getDashboardStats() {
  const supabase = await createClient();

  async function count(
    table: string,
    filter?: { column: string; value: string },
  ) {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    const { count: total, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return 0;
      throw new Error(error.message);
    }
    return total ?? 0;
  }

  const [publishedTours, publishedPosts, pendingBookings, pendingConsultations, pendingMessages, subscribers] =
    await Promise.all([
      count("tours", { column: "status", value: "published" }),
      count("blog_posts", { column: "status", value: "published" }),
      count("tour_bookings", { column: "status", value: "pending" }),
      count("consultation_bookings", { column: "status", value: "pending" }),
      count("contact_messages", { column: "status", value: "pending" }),
      count("newsletter_subscribers"),
    ]);

  return {
    publishedTours,
    publishedPosts,
    pendingBookings,
    pendingConsultations,
    pendingMessages,
    subscribers,
  };
}
