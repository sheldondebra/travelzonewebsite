-- Travel Zone Ghana — run once in Supabase SQL Editor
-- https://supabase.com/dashboard/project/xdegzidfeccjeajedxes/sql/new

-- Bookings
create table if not exists public.tour_bookings (
  id text primary key,
  tour_slug text not null,
  tour_title text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  travel_date date not null,
  travelers integer not null check (travelers > 0),
  special_requests text,
  estimated_total numeric(10, 2) not null,
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('unpaid', 'pending', 'paid', 'failed')),
  paystack_reference text unique,
  paid_amount numeric(10, 2),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tour_bookings enable row level security;

create index if not exists tour_bookings_created_at_idx on public.tour_bookings (created_at desc);
create index if not exists tour_bookings_status_idx on public.tour_bookings (status);

-- Staff helpers (JWT fallback until public.users exists; replaced at end of file)
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

drop trigger if exists tours_updated_at on public.tours;
create trigger tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

alter table public.tours enable row level security;

drop policy if exists "Public can read published tours" on public.tours;
create policy "Public can read published tours"
  on public.tours for select using (status = 'published');

drop policy if exists "Staff can read all tours" on public.tours;
create policy "Staff can read all tours"
  on public.tours for select to authenticated using (public.is_staff());

drop policy if exists "Staff can insert tours" on public.tours;
create policy "Staff can insert tours"
  on public.tours for insert to authenticated with check (public.is_staff());

drop policy if exists "Staff can update tours" on public.tours;
create policy "Staff can update tours"
  on public.tours for update to authenticated
  using (public.staff_role() = 'admin' or author_id = auth.uid())
  with check (public.staff_role() = 'admin' or author_id = auth.uid());

drop policy if exists "Admins can delete tours" on public.tours;
create policy "Admins can delete tours"
  on public.tours for delete to authenticated using (public.staff_role() = 'admin');

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

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts for select using (status = 'published');

drop policy if exists "Staff can read all blog posts" on public.blog_posts;
create policy "Staff can read all blog posts"
  on public.blog_posts for select to authenticated using (public.is_staff());

drop policy if exists "Staff can insert blog posts" on public.blog_posts;
create policy "Staff can insert blog posts"
  on public.blog_posts for insert to authenticated with check (public.is_staff());

drop policy if exists "Staff can update blog posts" on public.blog_posts;
create policy "Staff can update blog posts"
  on public.blog_posts for update to authenticated
  using (public.staff_role() = 'admin' or author_id = auth.uid())
  with check (public.staff_role() = 'admin' or author_id = auth.uid());

drop policy if exists "Admins can delete blog posts" on public.blog_posts;
create policy "Admins can delete blog posts"
  on public.blog_posts for delete to authenticated using (public.staff_role() = 'admin');

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);

-- Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Staff can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Staff can read newsletter subscribers"
  on public.newsletter_subscribers for select to authenticated using (public.is_staff());

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

-- Booking staff policies
drop policy if exists "Staff can read bookings" on public.tour_bookings;
create policy "Staff can read bookings"
  on public.tour_bookings for select to authenticated using (public.is_staff());

drop policy if exists "Admins can update bookings" on public.tour_bookings;
create policy "Admins can update bookings"
  on public.tour_bookings for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

-- Consultation bookings
create table if not exists public.consultation_bookings (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time text not null check (
    preferred_time in ('09:00', '10:30', '12:00', '14:00', '15:30')
  ),
  topic text not null check (
    topic in (
      'tour-package',
      'airline-ticketing',
      'group-travel',
      'corporate',
      'insurance-hotels',
      'other'
    )
  ),
  mode text not null check (mode in ('in-office', 'phone')),
  notes text,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  created_at timestamptz not null default now()
);

alter table public.consultation_bookings enable row level security;

create index if not exists consultation_bookings_created_at_idx
  on public.consultation_bookings (created_at desc);

create index if not exists consultation_bookings_status_idx
  on public.consultation_bookings (status);

create index if not exists consultation_bookings_preferred_date_idx
  on public.consultation_bookings (preferred_date);

drop policy if exists "Staff can read consultation bookings" on public.consultation_bookings;
create policy "Staff can read consultation bookings"
  on public.consultation_bookings for select to authenticated
  using (public.is_staff());

drop policy if exists "Admins can update consultation bookings" on public.consultation_bookings;
create policy "Admins can update consultation bookings"
  on public.consultation_bookings for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

-- Contact form messages
create table if not exists public.contact_messages (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  subject text not null check (
    subject in ('tour', 'corporate', 'group', 'ticketing', 'other')
  ),
  message text not null,
  status text not null default 'pending' check (
    status in ('pending', 'read', 'archived')
  ),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

drop policy if exists "Staff can read contact messages" on public.contact_messages;
create policy "Staff can read contact messages"
  on public.contact_messages for select to authenticated
  using (public.is_staff());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
  on public.contact_messages for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

-- Storage
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view media" on storage.objects;
create policy "Public can view media"
  on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Staff can upload media" on storage.objects;
create policy "Staff can upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

drop policy if exists "Staff can update media" on storage.objects;
create policy "Staff can update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.staff_role() = 'admin');

-- Site settings (Paystack, SplitSMS, SMTP, notifications)
create table if not exists public.site_settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Admins can read site settings" on public.site_settings;
create policy "Admins can read site settings"
  on public.site_settings for select to authenticated
  using (public.staff_role() = 'admin');

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert to authenticated
  with check (public.staff_role() = 'admin');

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

-- Staff users (admin dashboard)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor')),
  display_name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on public.users (lower(email));
create index if not exists users_role_idx on public.users (role);

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
  on public.users for select to authenticated
  using (public.staff_role() = 'admin');

drop policy if exists "Staff can read own user row" on public.users;
create policy "Staff can read own user row"
  on public.users for select to authenticated
  using (id = auth.uid());

drop policy if exists "Admins can insert users" on public.users;
create policy "Admins can insert users"
  on public.users for insert to authenticated
  with check (public.staff_role() = 'admin');

drop policy if exists "Admins can update users" on public.users;
create policy "Admins can update users"
  on public.users for update to authenticated
  using (public.staff_role() = 'admin')
  with check (public.staff_role() = 'admin');

drop policy if exists "Admins can delete users" on public.users;
create policy "Admins can delete users"
  on public.users for delete to authenticated
  using (public.staff_role() = 'admin');

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.role
      from public.users u
      where u.id = auth.uid()
        and u.is_active = true
    ),
    case
      when not exists (select 1 from public.users u where u.id = auth.uid())
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'editor')
      then auth.jwt() -> 'app_metadata' ->> 'role'
      else ''
    end,
    ''
  );
$$;
