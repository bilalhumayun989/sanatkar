-- =========================================================
-- Run this in the Supabase SQL editor.
-- This script adds contact fields to the listings table.
-- =========================================================

alter table public.listings
  add column if not exists phone_number text;

alter table public.listings
  add column if not exists secondary_phone text;

alter table public.listings
  add column if not exists allow_whatsapp boolean not null default false;
