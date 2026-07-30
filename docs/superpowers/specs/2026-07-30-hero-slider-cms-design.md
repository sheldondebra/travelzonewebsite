# Hero Slider CMS Design

**Date:** 2026-07-30  
**Status:** Approved — implement

## Goal

Admins can manage home hero slider images and per-slide copy/CTAs from `/admin/hero`. Seed the database with the current hard-coded content so the public site looks unchanged until edited.

## Decisions

- **Per-slide content:** each slide has its own image, eyebrow, headline, body, and up to 3 CTAs
- **Admin UX:** single inline page (add / edit / reorder / toggle / delete; Save all)
- **Access:** admins only
- **Storage:** dedicated `hero_slides` table (not `site_settings` JSON)
- **Public fallback:** if DB empty/unavailable, use current hard-coded slides

## Data model

Table `public.hero_slides`:

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | `gen_random_uuid()` |
| `image_url` | text NOT NULL | `/images/...` or uploaded media URL |
| `image_alt` | text NOT NULL default `''` | |
| `eyebrow` | text NOT NULL default `''` | |
| `headline` | text NOT NULL | |
| `body` | text NOT NULL default `''` | |
| `ctas` | jsonb NOT NULL default `[]` | `[{ label, href, style: "primary" \| "secondary" }]` max 3 |
| `sort_order` | integer NOT NULL default 0 | ascending |
| `is_active` | boolean NOT NULL default true | inactive hidden on public site |
| `created_at` / `updated_at` | timestamptz | `set_updated_at` trigger |

Indexes: `(sort_order asc, updated_at desc)`, `(is_active)`.

## Seed

Four slides from current hero images under `public/images/hero/`, each with today’s shared copy:

- Eyebrow: `#2 Boundary Road · East Legon · Accra`
- Headline: `Experience Ghana with Travel Zone.`
- Body: flights/hotels/tours walk-in copy
- CTAs: Book a trip (`/book`, primary), Book a consultation (`/consultation`, secondary), View packages (`/tours`, secondary)

Seed via `schema.sql` INSERT … ON CONFLICT and `seedDefaultHeroSlidesIfEmpty` on admin page load / `npm run seed`.

## Admin UI

- Route: `/admin/hero`
- Sidebar: “Hero slider”, `adminOnly`
- Upload folder root: `hero` (add to allowlist)
- Client form: stacked cards; Move up/down; Active checkbox; Add slide; Save all
- Server action: `requireAdmin` + sync replace (upsert by id, delete removed, set sort_order by index)
- Validation: active slides need image + headline; partial CTAs rejected

## Public site

- `getPublishedHeroSlides()` returns active slides ordered by `sort_order`
- `page.tsx` loads slides server-side and passes to client `Hero`
- Active index drives image **and** overlay copy/CTAs
- Autoplay 7000ms, pause on hover, dots — unchanged behavior
- Instagram footer line stays hard-coded (not CMS)

## Error handling

- Missing table → admin guidance / setup; public uses fallback
- Save failures return action error toast
- Revalidate `/` and `/admin/hero` on save
