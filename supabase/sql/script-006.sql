-- SQL-008: efficient lookup for the "Ordenar tareas" view.
-- Covers authenticated user filtering plus the visual order and stable tie-breakers.

create index if not exists tasks_user_orderable_idx
  on public.tasks(user_id, order_points desc, created_at desc, id asc)
  where order_points is not null
    and task_status not in ('Done', 'Undone', 'Unfinished');
