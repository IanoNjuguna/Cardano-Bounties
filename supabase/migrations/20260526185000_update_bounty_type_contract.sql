alter table if exists public.bounties
  add column if not exists custom_type text;

alter table if exists public.bounties
  drop constraint if exists bounties_type_check;

alter table if exists public.bounties
  add constraint bounties_type_check
  check (type in (
    'development',
    'design',
    'content',
    'hackathon',
    'documentation',
    'research',
    'community',
    'security',
    'other',
    'micro-task'
  )) not valid;
