-- DayFlow schema: profiles, routine_slots, daily_completions, tasks
-- Run in Supabase SQL editor (or via supabase db push)

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  timezone      text not null default 'UTC',
  theme         text not null default 'system' check (theme in ('light','dark','system')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- routine_slots (repeating daily template)
-- ============================================================
create table if not exists public.routine_slots (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  time      text not null,
  label     text not null,
  note      text,
  category  text not null check (category in ('work','health','personal')),
  position  integer not null default 0
);

create index if not exists routine_slots_user_time_idx
  on public.routine_slots (user_id, time, position);

-- ============================================================
-- daily_completions (per-day completion of a routine slot)
-- ============================================================
create table if not exists public.daily_completions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  slot_id    uuid not null references public.routine_slots(id) on delete cascade,
  completed  boolean not null default false,
  unique (user_id, date, slot_id)
);

create index if not exists daily_completions_user_date_idx
  on public.daily_completions (user_id, date);

-- ============================================================
-- tasks (one-off items for a specific day)
-- ============================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  time        text not null,
  label       text not null,
  note        text,
  category    text check (category in ('work','health','personal')),
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists tasks_user_date_idx
  on public.tasks (user_id, date, time);

-- ============================================================
-- updated_at trigger for profiles
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
