-- SQL-010 (CONF): optional external tracker and ticket numbering.
-- project-external-page: base URL used to build ticket links. Blank means the account
-- is not connected to any external tracker, so tickets are shown as plain text.
-- project-ticket-model: ticket template, where the X run is replaced by the number (TEST-XXXX).
-- project-ticket-order: current counter. When it holds a number the ticket is prefilled on
-- creation and the counter is increased by 1; when it is blank the user types the ticket.

insert into public.gestask_configuration(name, parameter_type, default_value, fixed_value)
values
  ('project-external-page', 'string', 'https://jira.knowmadmood.com/browse/', false),
  ('project-ticket-model', 'string', '', false),
  ('project-ticket-order', 'string', '', false)
on conflict (lower(name)) do update
set
  parameter_type = excluded.parameter_type,
  default_value = excluded.default_value,
  fixed_value = excluded.fixed_value,
  updated_at = now();
