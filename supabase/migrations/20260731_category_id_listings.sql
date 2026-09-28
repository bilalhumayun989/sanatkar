-- =========================================================
-- Run this in the Supabase SQL editor.
-- This script is idempotent – safe to re-run multiple times.
-- =========================================================

-- =========================================================
-- 1. Create the categories table (if it does not exist yet)
-- =========================================================
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  sort_order int  not null default 100,
  image_url  text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

do $$ begin
  create policy "anyone can read categories" on public.categories for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can create categories" on public.categories for insert
  to authenticated with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admins update categories" on public.categories for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admins delete categories" on public.categories for delete
  to authenticated using (public.is_admin());
exception when duplicate_object then null; end $$;

-- =========================================================
-- 2. Create the listings table (if it does not exist yet)
-- =========================================================
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  brand       text,
  category    text,
  price       numeric not null default 0,
  year        int,
  hours       int      default 0,
  location    text,
  description text,
  image_urls  text[]   default '{}',
  seller_id   uuid references auth.users(id) on delete cascade,
  condition   text     default 'new',
  status      text     not null default 'active',
  created_at  timestamptz not null default now()
);

-- Patch existing listings table: add category_id FK if missing
alter table public.listings
  add column if not exists category_id uuid references public.categories(id);

alter table public.listings enable row level security;

do $$ begin
  create policy "anyone can read active listings" on public.listings for select
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can insert listings" on public.listings for insert
  to authenticated with check (seller_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owners and admins update listings" on public.listings for update
  to authenticated
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owners and admins delete listings" on public.listings for delete
  to authenticated using (seller_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

-- =========================================================
-- 3. Seed default categories
-- =========================================================
insert into public.categories (name, slug, sort_order) values
  ('Machines',    'machines',    1),
  ('Parts',       'parts',       2),
  ('Tools',       'tools',       3),
  ('Accessories', 'accessories', 4)
on conflict (slug) do nothing;

-- =========================================================
-- 4. Stats view: category listing counts + latest image
-- =========================================================
create or replace view public.categories_with_stats as
select
  c.id,
  c.name,
  c.slug,
  c.sort_order,
  coalesce(c.image_url, latest.first_image) as image_url,
  coalesce(counts.listing_count, 0)         as listing_count
from public.categories c
left join lateral (
  select count(*) as listing_count
  from public.listings l
  where l.category_id = c.id and l.status = 'active'
) counts on true
left join lateral (
  select l.image_urls[1] as first_image
  from public.listings l
  where l.category_id = c.id
    and l.status = 'active'
    and l.image_urls is not null
    and array_length(l.image_urls, 1) > 0
  order by l.created_at desc
  limit 1
) latest on true
order by c.sort_order;
