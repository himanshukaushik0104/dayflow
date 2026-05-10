-- Add day-of-week scoping to routine slots.
-- NULL = applies every day (preserves the prior "always on" behaviour for
-- existing rows). 0..6 follows JS Date.getDay(): 0=Sun, 1=Mon … 6=Sat.

alter table public.routine_slots
  add column if not exists day_of_week smallint
  check (day_of_week is null or (day_of_week between 0 and 6));

create index if not exists routine_slots_user_day_idx
  on public.routine_slots (user_id, day_of_week);
