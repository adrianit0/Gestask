-- SQL-006/SQL-007: completion workflow metadata and lookup indexes.
-- Adds optional fields used by the future "Completar tareas" workflow and indexes for completion queries.

alter table public.tasks
  add column if not exists pr_link text null;

alter table public.tasks
  add column if not exists test_cases text null;

alter table public.tasks
  add column if not exists imputed_date date null;

create index if not exists tasks_user_completion_status_idx
  on public.tasks(user_id, task_status, pr_status, ticket_type)
  where task_status = 'Done';

create index if not exists tasks_user_imputed_date_idx
  on public.tasks(user_id, imputed_date);
