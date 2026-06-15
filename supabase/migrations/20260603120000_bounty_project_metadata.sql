alter table if exists public.bounties
  add column if not exists project_id uuid,
  add column if not exists bounty_instructions text;

