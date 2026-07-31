-- =========================================================
-- Run this in the Supabase SQL editor.
-- This script is idempotent – safe to re-run multiple times.
-- =========================================================

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.favorites enable row level security;

create unique index if not exists favorites_user_listing_unique on public.favorites (user_id, listing_id);

do $$ begin
  create policy "authenticated users can read own favorites" on public.favorites for select
  using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can insert own favorites" on public.favorites for insert
  to authenticated with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authenticated users can delete own favorites" on public.favorites for delete
  to authenticated using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
