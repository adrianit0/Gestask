create extension if not exists pgcrypto;

ALTER TABLE profiles
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE profiles
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket text null,
  assigned_date date not null default current_date,
  finished_date date null,
  title text not null,
  effort_points integer not null default 3,
  order_points integer null,
  priority text not null default 'Menor',
  task_status text not null default 'To do',
  pr_status text not null default 'Not Finished',
  more_info text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_effort_points_check check (effort_points >= 0),
  constraint tasks_priority_check check (priority in ('Trivial','Menor','Prioritaria','Crítica','Bloqueante')),
  constraint tasks_task_status_check check (task_status in ('To do','Doing','Draft','Undone','Unfinished','Need Fix','Waiting','Done','Warning')),
  constraint tasks_pr_status_check check (pr_status in ('Not Finished','Need PR','PR Hecho','Imputed','Deployed'))
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, report_date)
);

create table if not exists public.daily_report_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_report_id uuid not null references public.daily_reports(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(daily_report_id, task_id)
);

create table if not exists public.calendar_day_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  status text not null,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, day),
  constraint calendar_day_status_check check (status in ('Laboral','Vacaciones','Festivos','Ausencia'))
);

create index if not exists tasks_user_status_idx on public.tasks(user_id, task_status);
create index if not exists tasks_user_finished_date_idx on public.tasks(user_id, finished_date);
create index if not exists daily_reports_user_date_idx on public.daily_reports(user_id, report_date);
create index if not exists calendar_status_user_day_idx on public.calendar_day_statuses(user_id, day);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_task_state()
returns trigger
language plpgsql
as $$
begin
  if new.task_status = 'Done' then
    if new.finished_date is null then
      new.finished_date = current_date;
    end if;
    if new.pr_status = 'Not Finished' then
      new.pr_status = 'Need PR';
    end if;
  else
    new.finished_date = null;
    new.pr_status = 'Not Finished';
  end if;
  return new;
end;
$$;

create or replace function public.sync_task_with_today_report()
returns trigger
language plpgsql
as $$
declare
  today_report_id uuid;
begin
  if new.task_status in ('To do','Doing','Draft','Need Fix','Waiting','Warning') then
    select id into today_report_id
    from public.daily_reports
    where user_id = new.user_id and report_date = current_date
    limit 1;

    if today_report_id is not null then
      insert into public.daily_report_tasks(daily_report_id, task_id)
      values (today_report_id, new.id)
      on conflict (daily_report_id, task_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
before update on public.tasks
for each row execute function public.touch_updated_at();

drop trigger if exists daily_reports_touch_updated_at on public.daily_reports;
create trigger daily_reports_touch_updated_at
before update on public.daily_reports
for each row execute function public.touch_updated_at();

drop trigger if exists calendar_status_touch_updated_at on public.calendar_day_statuses;
create trigger calendar_status_touch_updated_at
before update on public.calendar_day_statuses
for each row execute function public.touch_updated_at();

drop trigger if exists tasks_normalize_state on public.tasks;
create trigger tasks_normalize_state
before insert or update on public.tasks
for each row execute function public.normalize_task_state();

drop trigger if exists tasks_sync_today_report on public.tasks;
create trigger tasks_sync_today_report
after insert or update on public.tasks
for each row execute function public.sync_task_with_today_report();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_reports enable row level security;
alter table public.daily_report_tasks enable row level security;
alter table public.calendar_day_statuses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

drop policy if exists "daily_reports_select_own" on public.daily_reports;
create policy "daily_reports_select_own" on public.daily_reports for select using (auth.uid() = user_id);

drop policy if exists "daily_reports_insert_own" on public.daily_reports;
create policy "daily_reports_insert_own" on public.daily_reports for insert with check (auth.uid() = user_id);

drop policy if exists "daily_reports_update_own" on public.daily_reports;
create policy "daily_reports_update_own" on public.daily_reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_report_tasks_select_own" on public.daily_report_tasks;
create policy "daily_report_tasks_select_own" on public.daily_report_tasks for select using (
  exists (select 1 from public.daily_reports dr where dr.id = daily_report_id and dr.user_id = auth.uid())
);

drop policy if exists "daily_report_tasks_insert_own" on public.daily_report_tasks;
create policy "daily_report_tasks_insert_own" on public.daily_report_tasks for insert with check (
  exists (select 1 from public.daily_reports dr where dr.id = daily_report_id and dr.user_id = auth.uid())
  and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
);

drop policy if exists "calendar_status_select_own" on public.calendar_day_statuses;
create policy "calendar_status_select_own" on public.calendar_day_statuses for select using (auth.uid() = user_id);

drop policy if exists "calendar_status_insert_own" on public.calendar_day_statuses;
create policy "calendar_status_insert_own" on public.calendar_day_statuses for insert with check (auth.uid() = user_id);

drop policy if exists "calendar_status_update_own" on public.calendar_day_statuses;
create policy "calendar_status_update_own" on public.calendar_day_statuses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
