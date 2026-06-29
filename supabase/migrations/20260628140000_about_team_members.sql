-- Public-facing team profiles for the About Us page (separate from staff dashboard users).

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

alter table public.about_team_members enable row level security;

drop policy if exists "Public can read published about team members" on public.about_team_members;
create policy "Public can read published about team members"
  on public.about_team_members for select
  using (status = 'published');

drop policy if exists "Staff can read about team members" on public.about_team_members;
create policy "Staff can read about team members"
  on public.about_team_members for select to authenticated
  using (public.is_staff());

drop policy if exists "Staff can insert about team members" on public.about_team_members;
create policy "Staff can insert about team members"
  on public.about_team_members for insert to authenticated
  with check (public.is_staff());

drop policy if exists "Staff can update about team members" on public.about_team_members;
create policy "Staff can update about team members"
  on public.about_team_members for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Admins can delete about team members" on public.about_team_members;
create policy "Admins can delete about team members"
  on public.about_team_members for delete to authenticated
  using (public.staff_role() = 'admin');

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
