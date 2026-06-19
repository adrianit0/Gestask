-- SQL-009 (CONF): extra hours configuration for the daily schedule.
-- PE_diario_extra defines how many effort points are added beyond the configured end time
-- when the user enables "Incluir horas" in the daily schedule view.

insert into public.gestask_configuration(name, parameter_type, default_value, fixed_value)
values
  ('PE_diario_extra', 'number', '3', false)
on conflict (lower(name)) do update
set
  parameter_type = excluded.parameter_type,
  default_value = excluded.default_value,
  fixed_value = excluded.fixed_value,
  updated_at = now();
