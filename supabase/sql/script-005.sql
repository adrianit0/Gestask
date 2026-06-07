-- PR workflow state migration: replace "PR Hecho" with "Need to Impute".
-- Task tickets now enter "Need to Impute" when finished and only become "Imputed" after confirmation.

alter table public.tasks
  drop constraint if exists tasks_ticket_type_pr_status_check;

alter table public.tasks
  drop constraint if exists tasks_pr_status_check;

update public.tasks
set pr_status = 'Need to Impute'
where pr_status = 'PR Hecho';

update public.tasks
set pr_status = 'Need to Impute'
where ticket_type = 'Task'
  and task_status = 'Done'
  and pr_status = 'Imputed'
  and imputed_date is null;

alter table public.tasks
  add constraint tasks_pr_status_check
  check (pr_status in ('Not Finished','Need PR','Need to Impute','Imputed','Deployed'));

alter table public.tasks
  add constraint tasks_ticket_type_pr_status_check
  check (ticket_type <> 'Task' or pr_status in ('Not Finished', 'Need to Impute', 'Imputed'));

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
