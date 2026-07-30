-- Travel Zone Ghana — Hostinger / plain PostgreSQL schema
-- Run via: npm run db:setup

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Staff users (admin dashboard)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null default '',
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

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx
  on public.password_reset_tokens (user_id);

create index if not exists password_reset_tokens_expires_idx
  on public.password_reset_tokens (expires_at);

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

create index if not exists tour_bookings_created_at_idx on public.tour_bookings (created_at desc);
create index if not exists tour_bookings_status_idx on public.tour_bookings (status);

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
  author_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

drop trigger if exists tours_updated_at on public.tours;
create trigger tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

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
  author_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);

-- Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

-- Consultation bookings
create table if not exists public.consultation_bookings (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time text not null check (preferred_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
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

create index if not exists consultation_bookings_created_at_idx
  on public.consultation_bookings (created_at desc);
create index if not exists consultation_bookings_status_idx
  on public.consultation_bookings (status);
create index if not exists consultation_bookings_preferred_date_idx
  on public.consultation_bookings (preferred_date);

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

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages (status);

-- Flight ticket booking requests
create table if not exists public.ticket_booking_requests (
  id text primary key,
  full_name text not null,
  email text not null,
  phone text not null,
  trip_type text not null check (trip_type in ('one-way', 'round-trip')),
  origin text not null,
  destination text not null,
  departure_date date not null,
  return_date date,
  passengers integer not null check (passengers > 0),
  cabin_class text not null default 'economy' check (
    cabin_class in ('economy', 'premium-economy', 'business', 'first')
  ),
  flexible_dates boolean not null default false,
  notes text,
  status text not null default 'pending' check (
    status in ('pending', 'quoted', 'booked', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create index if not exists ticket_booking_requests_created_at_idx
  on public.ticket_booking_requests (created_at desc);
create index if not exists ticket_booking_requests_status_idx
  on public.ticket_booking_requests (status);
create index if not exists ticket_booking_requests_departure_date_idx
  on public.ticket_booking_requests (departure_date);

-- Site settings
create table if not exists public.site_settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id) on delete set null
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- About page team members
create table if not exists public.about_team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text not null default '',
  image text not null default '',
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists about_team_members_sort_idx
  on public.about_team_members (sort_order asc, updated_at desc);
create index if not exists about_team_members_status_idx
  on public.about_team_members (status);

drop trigger if exists about_team_members_updated_at on public.about_team_members;
create trigger about_team_members_updated_at
  before update on public.about_team_members
  for each row execute function public.set_updated_at();

insert into public.about_team_members (id, name, role, bio, image, sort_order, status)
values
  (
    'a1111111-1111-4111-8111-111111111101',
    'Akosua Oesi',
    'CEO',
    'Leads Travel Zone with a focus on reliable service, strong airline partnerships, and trips that reflect the best of Ghana and beyond.',
    '/images/team/akosua-oesi.png',
    1,
    'published'
  ),
  (
    'a1111111-1111-4111-8111-111111111102',
    'Ama Adubea Amoah',
    'HR & Admin Manager',
    'Keeps the office running smoothly — from client records and bookings to the day-to-day support that makes every trip feel organized.',
    '/images/team/ama-adubea-amoah.png',
    2,
    'published'
  ),
  (
    'a1111111-1111-4111-8111-111111111103',
    'Dorinda Darko',
    'Senior Travel Consultant',
    'Works directly with travelers to build itineraries, compare fares, and find the right package for families, groups, and corporate clients.',
    '/images/team/dorinda-darko.png',
    3,
    'published'
  )
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  bio = excluded.bio,
  image = excluded.image,
  sort_order = excluded.sort_order,
  status = excluded.status,
  updated_at = now();

-- Home hero slider
create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  image_alt text not null default '',
  eyebrow text not null default '',
  headline text not null,
  body text not null default '',
  ctas jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_slides_sort_idx
  on public.hero_slides (sort_order asc, updated_at desc);
create index if not exists hero_slides_active_idx
  on public.hero_slides (is_active);

drop trigger if exists hero_slides_updated_at on public.hero_slides;
create trigger hero_slides_updated_at
  before update on public.hero_slides
  for each row execute function public.set_updated_at();

insert into public.hero_slides (
  id, image_url, image_alt, eyebrow, headline, body, ctas, sort_order, is_active
)
values
  (
    'b1111111-1111-4111-8111-111111111101',
    '/images/hero/office-consultation.jpg',
    'TravelZone team consulting with a client in our East Legon office',
    '#2 Boundary Road · East Legon · Accra',
    'Experience Ghana with Travel Zone.',
    'Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.',
    '[
      {"label":"Book a trip","href":"/book","style":"primary"},
      {"label":"Book a consultation","href":"/consultation","style":"secondary"},
      {"label":"View packages","href":"/tours","style":"secondary"}
    ]'::jsonb,
    1,
    true
  ),
  (
    'b1111111-1111-4111-8111-111111111102',
    '/images/hero/office-main.jpg',
    'TravelZone office interior with branded glass partitions',
    '#2 Boundary Road · East Legon · Accra',
    'Experience Ghana with Travel Zone.',
    'Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.',
    '[
      {"label":"Book a trip","href":"/book","style":"primary"},
      {"label":"Book a consultation","href":"/consultation","style":"secondary"},
      {"label":"View packages","href":"/tours","style":"secondary"}
    ]'::jsonb,
    2,
    true
  ),
  (
    'b1111111-1111-4111-8111-111111111103',
    '/images/hero/reception.jpg',
    'TravelZone reception area in East Legon, Accra',
    '#2 Boundary Road · East Legon · Accra',
    'Experience Ghana with Travel Zone.',
    'Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.',
    '[
      {"label":"Book a trip","href":"/book","style":"primary"},
      {"label":"Book a consultation","href":"/consultation","style":"secondary"},
      {"label":"View packages","href":"/tours","style":"secondary"}
    ]'::jsonb,
    3,
    true
  ),
  (
    'b1111111-1111-4111-8111-111111111104',
    '/images/hero/travel-wall.jpg',
    'TravelZone branded travel consultation space',
    '#2 Boundary Road · East Legon · Accra',
    'Experience Ghana with Travel Zone.',
    'Flights, hotels, tour packages, and group travel — booked from our office or over the phone. Walk in anytime during office hours.',
    '[
      {"label":"Book a trip","href":"/book","style":"primary"},
      {"label":"Book a consultation","href":"/consultation","style":"secondary"},
      {"label":"View packages","href":"/tours","style":"secondary"}
    ]'::jsonb,
    4,
    true
  )
on conflict (id) do update set
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  eyebrow = excluded.eyebrow,
  headline = excluded.headline,
  body = excluded.body,
  ctas = excluded.ctas,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
