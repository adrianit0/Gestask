-- SQL-010: intensive schedule configuration.
-- Intensive days (week days listed in dias_semana_intensivo, ISO 1=lunes..7=domingo, and months listed in meses_intensivo)
-- use hora_inicio_intensivo, hora_fin_intensivo and PE_diario_intensivo, with no break.

insert into public.gestask_configuration(name, parameter_type, default_value, fixed_value)
values
  ('dias_semana_intensivo', 'string', '5', false),
  ('meses_intensivo', 'string', '7,8', false),
  ('hora_inicio_intensivo', 'string', '8:00', false),
  ('hora_fin_intensivo', 'string', '15:00', false),
  ('PE_diario_intensivo', 'number', '9', false)
on conflict (lower(name)) do update
set
  parameter_type = excluded.parameter_type,
  default_value = excluded.default_value,
  fixed_value = excluded.fixed_value,
  updated_at = now();
