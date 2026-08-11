-- Per-user accent color for the "Mi colección" dashboard ambient background
-- Run this in the Supabase SQL Editor

alter table public.users
  add column if not exists theme_color text not null default '#00e559';
