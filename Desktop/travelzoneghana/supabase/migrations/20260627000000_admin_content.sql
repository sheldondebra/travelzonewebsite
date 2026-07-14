-- Admin CMS: tours, blog posts, newsletter subscribers

create or replace function public.staff_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.staff_role() in ('admin', 'editor');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tours
create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tagline text not null default '',
  location text not null default '',
  duration text not null default '',
  price numeric(10, 2) not null,
  currency text not null default 'USD' check (currency in ('USD', 'GHS')),
  price_note text not null default '',
  travel_period text not null default '',
  image text not null default '',
  gallery jsonb not null default '[]'::jsonb,
  description text not null default '',
  overview jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  included jsonb not null default '[]'::jsonb,
  category text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create trigger tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

alter table public.tours enable row level security;

create policy "Public can read published tours"
  on public.tours for select
  using (status = 'published');

create policy "Staff can read all tours"
  on public.tours for select
  to authenticated
  using (public.is_staff());

create policy "Staff can insert tours"
  on public.tours for insert
  to authenticated
  with check (public.is_staff());

create policy "Staff can update tours"
  on public.tours for update
  to authenticated
  using (
    public.staff_role() = 'admin'
    or author_id = auth.uid()
  )
  with check (
    public.staff_role() = 'admin'
    or author_id = auth.uid()
  );

create policy "Admins can delete tours"
  on public.tours for delete
  to authenticated
  using (public.staff_role() = 'admin');

create index if not exists tours_status_idx on public.tours (status);
create index if not exists tours_slug_idx on public.tours (slug);

-- Blog posts
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  body_html text not null default '',
  image text not null default '',
  category text not null default '',
  read_time text not null default '5 min read',
  display_date text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (status = 'published');

create policy "Staff can read all blog posts"
  on public.blog_posts for select
  to authenticated
  using (public.is_staff());

create policy "Staff can insert blog posts"
  on public.blog_posts for insert
  to authenticated
  with check (public.is_staff());

create policy "Staff can update blog posts"
  on public.blog_posts for update
  to authenticated
  using (
    public.staff_role() = 'admin'
    or author_id = auth.uid()
  )
  with check (
    public.staff_role() = 'admin'
    or author_id = auth.uid()
  );

create policy "Admins can delete blog posts"
  on public.blog_posts for delete
  to authenticated
  using (public.staff_role() = 'admin');

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Staff can read newsletter subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_staff());

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (true);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);
