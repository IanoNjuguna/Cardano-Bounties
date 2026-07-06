alter table if exists public.bounties
  add column if not exists platform_fee_amount numeric not null default 0,
  add column if not exists total_funding_amount numeric not null default 0,
  add column if not exists escrow_address text,
  add column if not exists escrow_tx_hash text,
  add column if not exists escrow_submitted_at timestamptz,
  add column if not exists escrow_confirmed_at timestamptz,
  add column if not exists payout_tx_hash text,
  add column if not exists refund_tx_hash text,
  add column if not exists refunded_at timestamptz,
  add column if not exists updated_at timestamptz default now();

update public.bounties
set
  platform_fee_amount = round((reward_amount * 0.10)::numeric, 6),
  total_funding_amount = round((reward_amount * 1.10)::numeric, 6)
where platform_fee_amount = 0
  and total_funding_amount = 0
  and reward_amount is not null;

update public.bounties
set status = 'pending_escrow'
where status = 'pending_approval';

alter table if exists public.bounties
  add constraint bounties_status_check
  check (status in (
    'pending_escrow',
    'awaiting_admin_review',
    'open',
    'completed',
    'cancelled',
    'rejected',
    'expired'
  )) not valid;

alter table if exists public.bounties
  add constraint bounties_reward_amount_positive
  check (reward_amount > 0) not valid;

alter table if exists public.bounties
  add constraint bounties_platform_fee_amount_nonnegative
  check (platform_fee_amount >= 0) not valid;

alter table if exists public.bounties
  add constraint bounties_total_funding_amount_check
  check (total_funding_amount >= reward_amount) not valid;

alter table if exists public.submissions
  add column if not exists feedback text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists transaction_hash text,
  add column if not exists updated_at timestamptz default now();
