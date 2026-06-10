-- SQL-009: schedule display time offset configuration.
-- Offsets only the displayed daily schedule times; internal planning remains based on hora_inicio, hora_fin and hora_descanso.

insert into public.gestask_configuration(name, parameter_type, default_value, fixed_value)
values
  ('hora_horario_offset', 'number', '0', false)
on conflict (lower(name)) do update
set
  parameter_type = excluded.parameter_type,
  default_value = excluded.default_value,
  fixed_value = excluded.fixed_value,
  updated_at = now();
