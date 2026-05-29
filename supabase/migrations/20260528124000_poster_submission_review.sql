alter table if exists public.submissions
  add column if not exists poster_review_status text not null default 'pending',
  add column if not exists poster_feedback text,
  add column if not exists poster_reviewed_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists submitted_at timestamptz default now();

alter table if exists public.submissions
  drop constraint if exists submissions_poster_review_status_check;

alter table if exists public.submissions
  add constraint submissions_poster_review_status_check
  check (poster_review_status in (
    'pending',
    'recommended_approval',
    'changes_requested',
    'rejected'
  )) not valid;
