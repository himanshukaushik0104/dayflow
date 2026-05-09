-- Row Level Security policies for DayFlow
-- Every table is private to its owner via auth.uid()

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- routine_slots
-- ============================================================
alter table public.routine_slots enable row level security;

drop policy if exists "routine_slots_select_own" on public.routine_slots;
create policy "routine_slots_select_own"
  on public.routine_slots for select
  using (auth.uid() = user_id);

drop policy if exists "routine_slots_insert_own" on public.routine_slots;
create policy "routine_slots_insert_own"
  on public.routine_slots for insert
  with check (auth.uid() = user_id);

drop policy if exists "routine_slots_update_own" on public.routine_slots;
create policy "routine_slots_update_own"
  on public.routine_slots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "routine_slots_delete_own" on public.routine_slots;
create policy "routine_slots_delete_own"
  on public.routine_slots for delete
  using (auth.uid() = user_id);

-- ============================================================
-- daily_completions
-- ============================================================
alter table public.daily_completions enable row level security;

drop policy if exists "daily_completions_select_own" on public.daily_completions;
create policy "daily_completions_select_own"
  on public.daily_completions for select
  using (auth.uid() = user_id);

drop policy if exists "daily_completions_insert_own" on public.daily_completions;
create policy "daily_completions_insert_own"
  on public.daily_completions for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_completions_update_own" on public.daily_completions;
create policy "daily_completions_update_own"
  on public.daily_completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_completions_delete_own" on public.daily_completions;
create policy "daily_completions_delete_own"
  on public.daily_completions for delete
  using (auth.uid() = user_id);

-- ============================================================
-- tasks
-- ============================================================
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);
