-- SQL-011: "Diaria" ticket type.
-- Daily tasks must be done every day a daily report is created while their finished_date is null.
-- They carry no effort points, order points nor PR workflow, and their per-day completion is stored
-- in daily_report_tasks.completed_at.

alter table public.tasks
  drop constraint if exists tasks_ticket_type_check;

alter table public.tasks
  add constraint tasks_ticket_type_check
  check (ticket_type in ('Bug', 'Feature', 'Task', 'Diaria'));

alter table public.daily_report_tasks
  add column if not exists completed_at timestamptz null;

create or replace function public.normalize_task_state()
returns trigger
language plpgsql
as $$
begin
  if new.ticket_type = 'Diaria' then
    -- Daily tasks are either active ("To do") or finished ("Done"); finished_date ends the recurrence.
    new.effort_points = 0;
    new.order_points = null;
    new.pr_status = 'Not Finished';
    new.imputed_date = null;
    if new.task_status = 'Done' then
      if new.finished_date is null then
        new.finished_date = current_date;
      end if;
    else
      new.task_status = 'To do';
      new.finished_date = null;
    end if;

    return new;
  end if;

  if new.ticket_type = 'Task' then
    if new.task_status = 'Done' then
      if new.finished_date is null then
        new.finished_date = current_date;
      end if;
      if new.pr_status in ('Not Finished', 'Need PR', 'PR Hecho', 'Deployed') then
        new.pr_status = 'Need to Impute';
      end if;
    else
      new.finished_date = null;
      new.pr_status = 'Not Finished';
      new.imputed_date = null;
    end if;

    return new;
  end if;

  if new.task_status = 'Done' then
    if new.finished_date is null then
      new.finished_date = current_date;
    end if;
    if new.pr_status = 'Not Finished' then
      new.pr_status = 'Need PR';
    elsif new.pr_status = 'PR Hecho' then
      new.pr_status = 'Need to Impute';
    end if;
  else
    new.finished_date = null;
    new.pr_status = 'Not Finished';
    new.imputed_date = null;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_daily_rules_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_daily_rules_check
      check (
        ticket_type <> 'Diaria'
        or (
          task_status in ('To do', 'Done')
          and pr_status = 'Not Finished'
          and effort_points = 0
          and order_points is null
        )
      );
  end if;
end;
$$;

create or replace function public.sync_task_with_today_report()
returns trigger
language plpgsql
as $$
declare
  today_report_id uuid;
begin
  if (new.ticket_type = 'Diaria' and new.finished_date is null)
    or (new.ticket_type <> 'Diaria' and new.task_status in ('To do','Doing','Draft','Need Fix','Waiting','Warning')) then
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

drop policy if exists "daily_report_tasks_update_own" on public.daily_report_tasks;
create policy "daily_report_tasks_update_own" on public.daily_report_tasks for update using (
  exists (select 1 from public.daily_reports dr where dr.id = daily_report_id and dr.user_id = auth.uid())
) with check (
  exists (select 1 from public.daily_reports dr where dr.id = daily_report_id and dr.user_id = auth.uid())
);

create index if not exists daily_report_tasks_pending_idx
  on public.daily_report_tasks(daily_report_id, task_id)
  where completed_at is null;
