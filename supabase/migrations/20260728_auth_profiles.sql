-- Run this in the Supabase SQL editor before deploying the application.
create type public.app_role as enum ('user', 'seller', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 50),
  phone text,
  additional_phone text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Creates a profile for every email/password sign-up. Role deliberately cannot come
-- from browser metadata: all new accounts begin as regular users.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- `cars` is the listings table used by this app. If retaining Prisma's quoted `Car`
-- table, map it to this schema/table first, or apply equivalent policies to that table.
alter table public.cars enable row level security;
alter table public.profiles enable row level security;

create function public.is_admin() returns boolean language sql stable security definer
set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy "profiles are visible to their owner or admins" on public.profiles for select
using (id = auth.uid() or public.is_admin());
create policy "owners update profile metadata only" on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());
-- Do not grant client INSERT/DELETE on profiles; trigger and admin handle those.

create policy "owners read ads" on public.cars for select
using ("sellerId" = auth.uid()::text or public.is_admin());
create policy "owners update ads" on public.cars for update
using ("sellerId" = auth.uid()::text or public.is_admin())
with check ("sellerId" = auth.uid()::text or public.is_admin());
create policy "owners delete ads" on public.cars for delete
using ("sellerId" = auth.uid()::text or public.is_admin());

-- Atomic server/RPC insert: prevents simultaneous requests from bypassing the 3-ad limit.
create function public.assert_can_create_ad(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare current_role public.app_role; ad_count integer;
begin
  if auth.uid() <> p_user_id and not public.is_admin() then raise exception 'not authorized'; end if;
  select role into current_role from public.profiles where id = p_user_id for update;
  select count(*) into ad_count from public.cars where "sellerId" = p_user_id::text;
  if current_role = 'user' and ad_count >= 3 then
    raise exception 'AD_LIMIT_REACHED: Upgrade to Seller to post more than 3 ads';
  end if;
end;
$$;

create function public.upgrade_to_seller() returns public.profiles
language plpgsql security definer set search_path = public as $$
declare result public.profiles;
begin
  update public.profiles set role = 'seller', updated_at = now()
  where id = auth.uid() and role = 'user' returning * into result;
  if result.id is null then select * into result from public.profiles where id = auth.uid(); end if;
  return result;
end;
$$;
grant execute on function public.assert_can_create_ad(uuid), public.upgrade_to_seller() to authenticated;
