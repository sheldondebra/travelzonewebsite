# Admin Dashboard Design Spec

**Date:** 2026-06-27  
**Project:** Travel Zone Ghana  
**Status:** Approved

## Summary

Build a WordPress-style admin dashboard at `/admin` so Travel Zone staff can manage tours, blog posts, bookings, and newsletter subscribers. Multiple staff accounts with role-based access (admin vs editor). Content moves from hardcoded TypeScript arrays into Supabase; images upload to Supabase Storage.

## Goals

1. Staff can create, edit, publish, and delete tours via structured forms.
2. Staff can create, edit, publish, and delete blog posts via a rich text editor (Tiptap).
3. Staff can view bookings; admins can update booking status.
4. Staff can view newsletter subscribers; admins can export CSV.
5. Admins can invite staff and assign roles.
6. Public site reads published content from Supabase (fallback to static seed during migration).

## Non-Goals (v1)

- Managing static page content (About, Contact, Services, homepage sections).
- Customer-facing accounts or booking self-service portal.
- Comments, plugins, themes, or full WordPress parity.
- Email marketing campaigns from the dashboard (view/export only).

## Architecture

```
Staff browser
  → /admin/login (Supabase Auth, email + password)
  → proxy.ts protects /admin/* (except /admin/login)
  → Admin layout (sidebar + top bar)
  → Server Actions / Route Handlers
  → Supabase Postgres (RLS by role) + Supabase Storage (media bucket)
  → Public site pages fetch published rows
```

**Stack additions:**

- `@supabase/ssr` — cookie-based auth in Next.js App Router
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link` — blog editor
- Existing: Next.js 16, React 19, Tailwind v4, `@supabase/supabase-js`

## Roles & Permissions

Roles stored in Supabase Auth `app_metadata.role` (never `user_metadata` — user-editable).

| Capability | admin | editor |
|------------|-------|--------|
| View dashboard stats | ✓ | ✓ |
| Tours: create/edit | ✓ | ✓ |
| Tours: publish | ✓ | ✓ (own drafts) |
| Tours: delete | ✓ | ✗ |
| Blog: create/edit | ✓ | ✓ |
| Blog: publish | ✓ | ✓ (own drafts) |
| Blog: delete | ✓ | ✗ |
| Bookings: view | ✓ | ✓ |
| Bookings: update status | ✓ | ✗ |
| Newsletter: view | ✓ | ✓ |
| Newsletter: export CSV | ✓ | ✓ |
| Users: invite / change roles | ✓ | ✗ |

**Publish rule for editors:** Editors may set `status = published` only when `author_id = auth.uid()`. Admins may publish any content.

## Database Schema

### `tours`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default `gen_random_uuid()` |
| slug | text UNIQUE NOT NULL | URL segment |
| title | text NOT NULL | |
| tagline | text | |
| location | text | |
| duration | text | e.g. "4 Nights / 5 Days" |
| price | numeric NOT NULL | |
| currency | text | `USD` or `GHS` |
| price_note | text | |
| travel_period | text | |
| image | text | Storage path or public URL |
| gallery | jsonb | string[] |
| description | text | |
| overview | jsonb | string[] |
| highlights | jsonb | string[] |
| included | jsonb | string[] |
| category | text | |
| status | text | `draft` \| `published` |
| author_id | uuid FK auth.users | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| published_at | timestamptz | nullable |

Public read: `status = published`. Staff read/write per RLS.

### `blog_posts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| slug | text UNIQUE NOT NULL | |
| title | text NOT NULL | |
| excerpt | text | |
| body_html | text NOT NULL | Tiptap HTML output |
| image | text | featured image |
| category | text | |
| read_time | text | e.g. "6 min read" |
| status | text | `draft` \| `published` |
| author_id | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| published_at | timestamptz | |

Public read: `status = published`.

### `newsletter_subscribers`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| email | text UNIQUE NOT NULL | lowercase |
| created_at | timestamptz | default now() |

### `tour_bookings` (existing)

Add RLS policies for authenticated staff read; admin-only update on `status`.

## Storage

**Bucket:** `media` (public read for published assets)

**Paths:**

- `tours/{slug}/{filename}`
- `blog/{slug}/{filename}`

RLS: authenticated staff with role in (`admin`, `editor`) can INSERT; admin can DELETE.

## Admin Routes

| Route | Purpose |
|-------|---------|
| `/admin/login` | Staff login (public) |
| `/admin` | Dashboard overview |
| `/admin/tours` | Tour list |
| `/admin/tours/new` | Create tour |
| `/admin/tours/[id]/edit` | Edit tour |
| `/admin/blog` | Blog list |
| `/admin/blog/new` | Create post |
| `/admin/blog/[id]/edit` | Edit post |
| `/admin/bookings` | Booking list |
| `/admin/bookings/[id]` | Booking detail |
| `/admin/newsletter` | Subscriber list + export |
| `/admin/users` | Staff management (admin only) |

## UI Layout

WordPress-inspired shell:

- Fixed left sidebar (240px): logo, nav links, collapse on mobile
- Top bar: page title, "View site" link, user menu (email, logout)
- Main content: white card on cream background matching brand tokens in `globals.css`
- Reuse existing design tokens: navy, red, cream, DM Sans / Playfair Display

**Tour form fields:** Match existing `Tour` type — repeatable list inputs for overview, highlights, included; image uploader for hero + gallery.

**Blog editor:** Tiptap with headings, bold/italic, lists, links, inline images (upload to Storage).

**Bookings table:** Columns — ID, tour, customer, travel date, travelers, payment status, booking status, created. Filters: status, payment_status, search by name/email.

## Auth Flow

1. First admin created manually in Supabase dashboard with `app_metadata: { "role": "admin" }`.
2. Admins invite editors via `/admin/users` — Supabase Admin API (`auth.admin.inviteUserByEmail`) with role in invite metadata.
3. Session refreshed via `@supabase/ssr` middleware/proxy pattern.
4. Unauthenticated access to `/admin/*` (except login) → redirect to `/admin/login`.

## Public Site Changes

- `src/lib/tours.ts` — replace static array with `getPublishedTours()` fetching Supabase; keep `formatPrice()` and helpers.
- `src/lib/content.ts` — replace `blogPosts` with `getPublishedBlogPosts()`; keep other static marketing content unchanged.
- Tour/blog pages use same components; data source becomes async server fetch.
- Booking flow continues using service role for writes; tour slugs resolved from DB.

## Environment Variables

Add to `.env.example`:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # browser + RLS client
# SUPABASE_SERVICE_ROLE_KEY already exists
```

## Migration & Seeding

1. SQL migrations for new tables, RLS, storage bucket policies.
2. Seed script reads current `tours.ts` and `blogPosts` from codebase, inserts as `published`.
3. Optional: migrate `data/newsletter.json` into `newsletter_subscribers`.

## Error Handling

- Server Actions return `{ success: true } | { success: false, error: string }`.
- Unauthorized role → redirect to `/admin` with toast or query param `?error=forbidden`.
- Failed uploads → inline field error, no partial save of broken gallery.
- Slug collision → validation error before insert.

## Verification Checklist

- [ ] Admin can log in; editor cannot access `/admin/users`
- [ ] Create tour draft → not visible on public `/tours`
- [ ] Publish tour → visible on public site
- [ ] Blog rich text with image renders correctly on `/blog/[slug]`
- [ ] Booking list loads from Supabase; admin can confirm/cancel
- [ ] Newsletter export downloads valid CSV
- [ ] `npm run build` passes
- [ ] Paystack webhook still works (service role unchanged)

## Implementation Phases

1. **Foundation** — packages, Supabase clients, migrations, proxy, login, admin shell
2. **Tours** — CRUD, uploads, public site reads from DB, seed
3. **Blog** — Tiptap editor, CRUD, public site reads from DB, seed
4. **Operations** — bookings admin, newsletter table + admin, dashboard stats
5. **Users** — invite flow, role management
