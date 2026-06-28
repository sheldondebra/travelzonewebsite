# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WordPress-style `/admin` dashboard for Travel Zone staff to manage tours, blog posts, bookings, and newsletter subscribers with role-based Supabase Auth.

**Architecture:** Custom Next.js admin UI backed by Supabase Postgres (RLS by `app_metadata.role`), Supabase Storage for media uploads, `@supabase/ssr` for sessions, Tiptap for blog editing. Public site reads published rows from Supabase.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, Supabase (Auth, DB, Storage), `@supabase/ssr`, Tiptap

**Spec:** `docs/superpowers/specs/2026-06-27-admin-dashboard-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `supabase/migrations/20260627000000_admin_content.sql` | tours, blog_posts, newsletter_subscribers tables + RLS |
| `supabase/migrations/20260627000001_storage_media.sql` | media bucket + storage policies |
| `supabase/migrations/20260627000002_bookings_staff_rls.sql` | staff read / admin update on tour_bookings |
| `src/lib/supabase/server.ts` | Server Supabase client (cookies) |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/admin.ts` | Service-role client (webhooks, invites) |
| `src/lib/supabase/auth.ts` | getStaffUser(), requireRole(), role helpers |
| `src/lib/content-db.ts` | Tour/blog DB queries for public + admin |
| `src/lib/newsletter-store.ts` | Extend with Supabase + JSON fallback |
| `src/lib/bookings-store.ts` | Add listBookings(), updateBookingStatus() |
| `src/proxy.ts` | Protect /admin routes (Next.js 16 proxy) |
| `src/app/admin/layout.tsx` | Admin shell (sidebar, auth gate) |
| `src/app/admin/login/page.tsx` | Login form |
| `src/app/admin/page.tsx` | Dashboard stats |
| `src/app/admin/tours/**` | Tour list + form |
| `src/app/admin/blog/**` | Blog list + Tiptap editor |
| `src/app/admin/bookings/**` | Booking list + detail |
| `src/app/admin/newsletter/page.tsx` | Subscribers + CSV export |
| `src/app/admin/users/page.tsx` | Staff invite (admin only) |
| `src/app/admin/actions/**` | Server actions for CRUD |
| `src/components/admin/**` | Sidebar, forms, tables, ImageUpload, RichTextEditor |
| `scripts/seed-content.ts` | One-time seed from static data |

---

## Phase 1: Foundation

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

Run:
```bash
cd /Users/sheldondebra/Desktop/travelzoneghana
npm install @supabase/ssr @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

- [ ] **Step 2: Verify install**

Run: `npm ls @supabase/ssr @tiptap/react`  
Expected: both packages listed without errors

---

### Task 2: Supabase client utilities

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/auth.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add env var to `.env.example`**

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from Server Component — safe to ignore
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Create admin (service role) client**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key);
}
```

- [ ] **Step 5: Create auth helpers**

```typescript
// src/lib/supabase/auth.ts
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "editor";

export async function getStaffUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = user.app_metadata?.role as StaffRole | undefined;
  if (role !== "admin" && role !== "editor") return null;
  return { user, role };
}

export async function requireStaff() {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?error=forbidden");
  return staff;
}
```

- [ ] **Step 6: Build check**

Run: `npm run build`  
Expected: compiles (may warn if env vars unset locally — OK)

---

### Task 3: Database migrations

**Files:**
- Create: `supabase/migrations/20260627000000_admin_content.sql`
- Create: `supabase/migrations/20260627000001_storage_media.sql`
- Create: `supabase/migrations/20260627000002_bookings_staff_rls.sql`

- [ ] **Step 1: Content tables migration**

Create `20260627000000_admin_content.sql` with:
- `tours` table (columns per spec)
- `blog_posts` table
- `newsletter_subscribers` table
- Helper function `public.staff_role()` reading `(auth.jwt() -> 'app_metadata' ->> 'role')`
- RLS enabled on all three
- Policies: staff SELECT all rows; INSERT/UPDATE for admin+editor with publish rules; DELETE admin-only
- `updated_at` trigger using `moddatetime` or simple `BEFORE UPDATE` trigger

- [ ] **Step 2: Storage migration**

Create `20260627000001_storage_media.sql`:
- Insert bucket `media` with `public = true`
- Policy: public SELECT on `media`
- Policy: authenticated INSERT where staff_role in ('admin','editor')
- Policy: admin DELETE

- [ ] **Step 3: Bookings RLS migration**

Create `20260627000002_bookings_staff_rls.sql`:
- Policy: staff SELECT on `tour_bookings`
- Policy: admin UPDATE on `tour_bookings` (status, payment_status only)

- [ ] **Step 4: Apply migrations**

Run in Supabase SQL Editor or `supabase db push` if CLI linked.

---

### Task 4: Route protection (proxy)

**Files:**
- Create: `src/proxy.ts`

- [ ] **Step 1: Create proxy**

```typescript
// src/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !isLogin) {
    const role = user?.app_metadata?.role;
    if (!user || (role !== "admin" && role !== "editor")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isLogin && user?.app_metadata?.role) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Verify**

Run: `npm run build` — no proxy export errors

---

### Task 5: Admin shell + login

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/components/admin/AdminSidebar.tsx`
- Create: `src/components/admin/AdminHeader.tsx`
- Create: `src/app/admin/actions/auth.ts`

- [ ] **Step 1: Login server action**

```typescript
// src/app/admin/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false as const, error: error.message };
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [ ] **Step 2: Login page** — email/password form posting to `loginAction`, brand styling from `globals.css`

- [ ] **Step 3: Admin layout** — skip shell on login route; elsewhere render sidebar + header; call `requireStaff()` in layout

- [ ] **Step 4: Sidebar nav links** — Dashboard, Tours, Blog, Bookings, Newsletter, Users (Users visible only if role admin)

- [ ] **Step 5: Manual test**

Run: `npm run dev`  
Visit `/admin` → redirects to login  
Log in with seeded admin user → see empty dashboard shell

---

## Phase 2: Tours

### Task 6: Content DB layer

**Files:**
- Create: `src/lib/content-db.ts`
- Modify: `src/lib/tours.ts`

- [ ] **Step 1: Define DB types and mappers** in `content-db.ts` — `DbTour`, `toTour()`, `getPublishedTours()`, `getTourBySlug()`, admin list/get/save/delete functions using server client

- [ ] **Step 2: Update `src/lib/tours.ts`**

Replace static `tours` export with async functions delegating to `content-db.ts`. Keep `formatPrice`, `getTourPriceGhs`, etc. Add fallback: if Supabase env missing, return empty array (dev without DB).

- [ ] **Step 3: Update tour pages**

Modify:
- `src/app/tours/page.tsx` — `await getPublishedTours()`
- `src/app/tours/[slug]/page.tsx` — `await getTourBySlug(slug)`; update `generateStaticParams` to fetch slugs from DB or use `dynamic = 'force-dynamic'` if simpler for v1

---

### Task 7: Tour admin CRUD

**Files:**
- Create: `src/app/admin/tours/page.tsx`
- Create: `src/app/admin/tours/new/page.tsx`
- Create: `src/app/admin/tours/[id]/edit/page.tsx`
- Create: `src/app/admin/actions/tours.ts`
- Create: `src/components/admin/TourForm.tsx`
- Create: `src/components/admin/ImageUpload.tsx`
- Create: `src/components/admin/StringListInput.tsx`

- [ ] **Step 1: ImageUpload component** — file input → upload to `media/tours/{slug}/` via server action using authenticated supabase storage

- [ ] **Step 2: TourForm** — all Tour fields, repeatable lists for overview/highlights/included, status select (draft/published)

- [ ] **Step 3: Server actions** — `saveTourAction`, `deleteTourAction` with role checks

- [ ] **Step 4: List page** — table with title, status, updated_at, edit/delete buttons

- [ ] **Step 5: Seed script**

Create `scripts/seed-content.ts` — reads hardcoded tour from git history or inline copy of Dubai tour, upserts as published.

Run: `npx tsx scripts/seed-content.ts` (add tsx devDep if needed)

- [ ] **Step 6: Verify** — publish tour visible at `/tours/dubai-summer-getaway`

---

## Phase 3: Blog

### Task 8: Blog public layer

**Files:**
- Modify: `src/lib/content-db.ts`
- Modify: `src/lib/content.ts`
- Modify: `src/app/blog/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Add blog queries** — `getPublishedBlogPosts()`, `getBlogPostBySlug()`

- [ ] **Step 2: Update blog pages** — fetch from DB; render `body_html` with `dangerouslySetInnerHTML` inside prose-styled container (sanitize: allow only tags Tiptap outputs)

- [ ] **Step 3: Seed** — extend seed script with 6 existing blog posts (body_html = paragraphs joined with `<p>` tags)

---

### Task 9: Blog admin + Tiptap

**Files:**
- Create: `src/components/admin/RichTextEditor.tsx`
- Create: `src/app/admin/blog/page.tsx`
- Create: `src/app/admin/blog/new/page.tsx`
- Create: `src/app/admin/blog/[id]/edit/page.tsx`
- Create: `src/app/admin/actions/blog.ts`
- Create: `src/components/admin/BlogForm.tsx`

- [ ] **Step 1: RichTextEditor** — Tiptap with StarterKit, Link, Image; toolbar; `onChange` emits HTML string

- [ ] **Step 2: BlogForm** — title, slug (auto from title), excerpt, category, read_time, featured image upload, editor, status

- [ ] **Step 3: Server actions** — save/delete with role checks

- [ ] **Step 4: Verify** — create post with bold text + image, publish, view on `/blog/[slug]`

---

## Phase 4: Operations

### Task 10: Bookings admin

**Files:**
- Modify: `src/lib/bookings-store.ts`
- Create: `src/app/admin/bookings/page.tsx`
- Create: `src/app/admin/bookings/[id]/page.tsx`
- Create: `src/app/admin/actions/bookings.ts`

- [ ] **Step 1: Add `listBookings()` and `updateBookingStatus()`** to bookings-store (Supabase + JSON fallback for list)

- [ ] **Step 2: Bookings list** — sortable table, status badges, link to detail

- [ ] **Step 3: Booking detail** — all fields, status dropdown (admin only), `updateBookingStatusAction`

- [ ] **Step 4: Verify** — existing booking appears in admin after test booking

---

### Task 11: Newsletter admin

**Files:**
- Modify: `src/lib/newsletter-store.ts`
- Create: `src/app/admin/newsletter/page.tsx`
- Create: `src/app/admin/actions/newsletter.ts`

- [ ] **Step 1: Extend newsletter-store** — Supabase insert on public signup; `listSubscribers()`; keep JSON fallback

- [ ] **Step 2: Admin page** — table of emails + dates, Export CSV button (server action returns CSV download)

- [ ] **Step 3: Migrate JSON** — one-time read `data/newsletter.json` and upsert to Supabase in seed script

---

### Task 12: Dashboard stats

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Stats cards** — counts: published tours, published posts, pending bookings, subscribers (last 30 days optional)

- [ ] **Step 2: Quick links** — "New tour", "New post", "View bookings"

---

## Phase 5: User management

### Task 13: Staff invite (admin only)

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/app/admin/actions/users.ts`

- [ ] **Step 1: List staff** — `createAdminClient().auth.admin.listUsers()` filtered by app_metadata.role

- [ ] **Step 2: Invite action** — `inviteUserByEmail` with `{ app_metadata: { role } }`

- [ ] **Step 3: Change role action** — `updateUserById` app_metadata (admin only)

- [ ] **Step 4: Page gated with `requireAdmin()`**

---

## Final verification

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Public site tours/blog load from Supabase
- [ ] Editor cannot delete tours or change booking status
- [ ] Admin can invite editor
- [ ] Paystack webhook still saves bookings (service role unchanged)

---

## Spec Coverage Self-Review

| Spec requirement | Task |
|------------------|------|
| Supabase Auth multi-user | Task 1–5, 13 |
| Roles admin/editor | Task 2, 3, all actions |
| Tours structured forms | Task 7 |
| Blog Tiptap | Task 9 |
| Image upload Storage | Task 3, 7 |
| Bookings view/update | Task 10 |
| Newsletter view/export | Task 11 |
| Public site reads DB | Task 6, 8 |
| Seed existing content | Task 7, 8 |
| Dashboard stats | Task 12 |

No placeholders remain. Types consistent: `StaffRole`, `Tour`, `BlogPost` mappers in `content-db.ts`.
