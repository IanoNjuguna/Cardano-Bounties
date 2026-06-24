alter table if exists public.users
  add column if not exists display_name text,
  add column if not exists bio text;
