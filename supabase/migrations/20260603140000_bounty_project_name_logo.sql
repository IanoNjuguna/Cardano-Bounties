alter table if exists public.bounties
  add column if not exists project_name text,
  add column if not exists project_logo_url text;
