alter table if exists public.users
  add column if not exists role text default 'user';

update public.users
set role = 'user'
where role is null;

alter table if exists public.users
  alter column role set default 'user',
  alter column role set not null;

alter table if exists public.users
  drop constraint if exists users_role_check;

alter table if exists public.users
  add constraint users_role_check
  check (role in ('user', 'admin')) not valid;
