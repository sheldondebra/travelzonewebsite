# Hero Slider CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins manage home hero slides (image + per-slide copy/CTAs) from `/admin/hero`, with current content seeded into Postgres.

**Architecture:** New `hero_slides` table + store + admin save-all action; public `Hero` receives slides from the server with static fallback.

**Tech Stack:** Next.js App Router, postgres.js, existing admin UI patterns (`ImageUpload`, `requireAdmin`).

## Global Constraints

- Follow existing admin CRUD patterns (about-team / tours)
- Admins only for hero management
- No new npm dependencies
- Keep public hero visual language unchanged
- `npm run lint` and `npm run build` must pass

---

### Task 1: Schema + types + store + seed

**Files:**
- Modify: `db/schema.sql`
- Create: `src/lib/hero-slides.ts`
- Create: `src/lib/hero-slides-store.ts`
- Modify: `scripts/seed-content.ts`
- Modify: `src/app/admin/actions/upload.ts` (allow `hero` folder)

- [ ] Add `hero_slides` table, indexes, trigger, and seed INSERT for 4 current slides
- [ ] Define `HeroCta`, `HeroSlide`, `AdminHeroSlide`, `HeroSlideInput` types
- [ ] Implement `getPublishedHeroSlides`, `listAdminHeroSlides`, `syncHeroSlides`, `seedDefaultHeroSlidesIfEmpty`
- [ ] Export `fallbackHeroSlides` matching current hard-coded content
- [ ] Seed in `npm run seed`; allow upload folder `hero`

### Task 2: Admin page + form + actions

**Files:**
- Create: `src/app/admin/actions/hero-slides.ts`
- Create: `src/components/admin/HeroSliderEditor.tsx`
- Create: `src/app/admin/(dashboard)/hero/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] `saveHeroSlidesAction` with `requireAdmin`, validation, revalidate `/` + `/admin/hero`
- [ ] Inline editor: cards, ImageUpload folder=`hero`, CTAs (max 3), reorder, active, add/delete, Save all
- [ ] Page loads slides (auto-seed if empty); sidebar link adminOnly

### Task 3: Public Hero wiring

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/app/page.tsx`

- [ ] `Hero` accepts `slides: HeroSlide[]`; render per-active-slide copy/CTAs
- [ ] Home page fetches published slides and passes them in

### Task 4: Verify + ship

- [ ] `npm run lint`
- [ ] `npm run db:setup` (if DATABASE_URL present)
- [ ] `npm run seed`
- [ ] `npm run build`
- [ ] Commit and push to git
