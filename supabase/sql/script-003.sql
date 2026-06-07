-- SQL-003/SQL-004/SQL-005/CONF-001: task metadata, Task PR rules, indexes and scoring configuration.
-- Adds optional limit date, ticket type catalog, persisted task comments, Task-specific PR normalization, filter/sort indexes and scoring defaults.

alter table public.tasks
  add column if not exists limit_date date null;

alter table public.tasks
  add column if not exists ticket_type text not null default 'Bug';

alter table public.tasks
  add column if not exists comments jsonb not null default '[]'::jsonb;

update public.tasks
set ticket_type = 'Bug'
where ticket_type is null;

update public.tasks
set comments = '[]'::jsonb
where comments is null;

alter table public.tasks
  alter column ticket_type set default 'Bug',
  alter column ticket_type set not null;

alter table public.tasks
  alter column comments set default '[]'::jsonb,
  alter column comments set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_ticket_type_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_ticket_type_check
      check (ticket_type in ('Bug', 'Feature', 'Task'));
  end if;
end;
$$;


update public.tasks
set
  pr_status = case
    when task_status = 'Done' then 'Imputed'
    else 'Not Finished'
  end,
  finished_date = case
    when task_status = 'Done' then coalesce(finished_date, current_date)
    else null
  end
where ticket_type = 'Task'
  and (
    pr_status not in ('Not Finished', 'Imputed')
    or (task_status <> 'Done' and pr_status <> 'Not Finished')
    or (task_status = 'Done' and pr_status <> 'Imputed')
    or (task_status <> 'Done' and finished_date is not null)
    or (task_status = 'Done' and finished_date is null)
  );

create or replace function public.normalize_task_state()
returns trigger
language plpgsql
as $$
begin
  if new.ticket_type = 'Task' then
    if new.task_status = 'Done' then
      if new.finished_date is null then
        new.finished_date = current_date;
      end if;
      new.pr_status = 'Imputed';
    else
      new.finished_date = null;
      new.pr_status = 'Not Finished';
    end if;

    return new;
  end if;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_ticket_type_pr_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_ticket_type_pr_status_check
      check (ticket_type <> 'Task' or pr_status in ('Not Finished', 'Imputed'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_comments_array_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_comments_array_check
      check (jsonb_typeof(comments) = 'array');
  end if;
end;
$$;

create index if not exists tasks_user_assigned_date_idx
  on public.tasks(user_id, assigned_date);

create index if not exists tasks_user_limit_date_idx
  on public.tasks(user_id, limit_date);

create index if not exists tasks_user_priority_idx
  on public.tasks(user_id, priority);

create index if not exists tasks_user_ticket_type_idx
  on public.tasks(user_id, ticket_type);

insert into public.gestask_configuration(name, parameter_type, default_value, fixed_value)
values
  ('scoring_dias_pasadas', 'number', '0.05', false),
  ('scoring_prioridad', 'number', '5', false),
  ('scoring_puntos_esfuerzo', 'number', '1', false),
  ('scoring_orden', 'number', '1', false),
  ('scoring_dias_limites', 'number', '5', false),
  ('scoring_tipo_bug', 'number', '1', false),
  ('scoring_tipo_feature', 'number', '1', false),
  ('scoring_tipo_task', 'number', '1', false),
  ('scoring_estado_waiting', 'number', '-1', false),
  ('scoring_estado_need_fix', 'number', '2', false),
  ('scoring_estado_warning', 'number', '1', false),
  ('PE_diario', 'number', '12', false),
  ('hora_inicio', 'string', '8:00', false),
  ('hora_fin', 'string', '17:30', false),
  ('hora_descanso', 'string', '14:00', false),
  ('duracion_descanso', 'number', '60', false)
on conflict (lower(name)) do update
set
  parameter_type = excluded.parameter_type,
  default_value = excluded.default_value,
  fixed_value = excluded.fixed_value,
  updated_at = now();
