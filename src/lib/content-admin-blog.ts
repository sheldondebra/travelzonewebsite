import { htmlToParagraphs } from "@/lib/content-public-html";
import type { AdminBlogPost, BlogPostInput, ContentStatus } from "@/lib/content-types";
import { databaseSetupError, isMissingTableError } from "@/lib/db/errors";
import { getSql } from "@/lib/db/postgres";
import { normalizeMediaUrl } from "@/lib/media-url";
import { sanitizeBlogHtml } from "@/lib/sanitize-html";

function rowToAdminBlogPost(row: Record<string, unknown>): AdminBlogPost {
  const bodyHtml = sanitizeBlogHtml((row.body_html as string) ?? "");
  return {
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    bodyHtml,
    content: htmlToParagraphs(bodyHtml),
    image: normalizeMediaUrl((row.image as string) ?? ""),
    date: (row.display_date as string) ?? "",
    category: (row.category as string) ?? "",
    readTime: (row.read_time as string) ?? "5 min read",
    id: row.id as string,
    status: row.status as ContentStatus,
    updatedAt: row.updated_at as string,
  };
}

export async function listAdminBlogPosts(): Promise<AdminBlogPost[]> {
  const sql = getSql();
  try {
    // List UI only needs metadata — skip heavy body_html until edit.
    const rows = await sql`
      select
        id, slug, title, excerpt, image, category, read_time,
        display_date, status, updated_at
      from public.blog_posts
      order by updated_at desc
    `;
    return rows.map((row) => ({
      slug: row.slug as string,
      title: row.title as string,
      excerpt: (row.excerpt as string) ?? "",
      bodyHtml: "",
      content: [],
      image: normalizeMediaUrl((row.image as string) ?? ""),
      date: (row.display_date as string) ?? "",
      category: (row.category as string) ?? "",
      readTime: (row.read_time as string) ?? "5 min read",
      id: row.id as string,
      status: row.status as ContentStatus,
      updatedAt: row.updated_at as string,
    }));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function getAdminBlogPost(id: string): Promise<AdminBlogPost | null> {
  const sql = getSql();
  try {
    const rows = await sql`select * from public.blog_posts where id = ${id}::uuid limit 1`;
    return rows[0] ? rowToAdminBlogPost(rows[0]) : null;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function saveBlogPost(
  input: BlogPostInput,
  options: { id?: string; authorId: string },
) {
  const sql = getSql();
  const publishedAt =
    input.status === "published" ? new Date().toISOString() : null;

  try {
    if (options.id) {
      await sql`
        update public.blog_posts set
          slug = ${input.slug},
          title = ${input.title},
          excerpt = ${input.excerpt},
          body_html = ${input.bodyHtml},
          image = ${input.image},
          category = ${input.category},
          read_time = ${input.readTime},
          display_date = ${input.date},
          status = ${input.status},
          author_id = ${options.authorId}::uuid,
          published_at = case
            when ${input.status} = 'published' then coalesce(published_at, ${publishedAt}::timestamptz)
            else null
          end,
          updated_at = now()
        where id = ${options.id}::uuid
      `;
      return options.id;
    }

    const rows = await sql<{ id: string }[]>`
      insert into public.blog_posts (
        slug, title, excerpt, body_html, image, category, read_time,
        display_date, status, author_id, published_at
      ) values (
        ${input.slug},
        ${input.title},
        ${input.excerpt},
        ${input.bodyHtml},
        ${input.image},
        ${input.category},
        ${input.readTime},
        ${input.date},
        ${input.status},
        ${options.authorId}::uuid,
        ${publishedAt}::timestamptz
      )
      returning id
    `;
    return rows[0].id;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function deleteBlogPost(id: string) {
  const sql = getSql();
  try {
    await sql`delete from public.blog_posts where id = ${id}::uuid`;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}

export async function updateBlogPostStatus(id: string, status: ContentStatus) {
  const sql = getSql();
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  try {
    await sql`
      update public.blog_posts
      set
        status = ${status},
        published_at = case
          when ${status} = 'published' then coalesce(published_at, ${publishedAt}::timestamptz)
          else published_at
        end,
        updated_at = now()
      where id = ${id}::uuid
    `;
  } catch (error) {
    if (isMissingTableError(error)) throw databaseSetupError();
    throw error;
  }
}
