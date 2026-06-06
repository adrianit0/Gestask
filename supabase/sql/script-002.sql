create extension if not exists pgcrypto;

create or replace function public.is_valid_configuration_value(
  configuration_parameter_type text,
  configuration_value text
)
returns boolean
language plpgsql
immutable
as $$
begin
  if configuration_value is null then
    return false;
  end if;

  case configuration_parameter_type
    when 'string' then
      return true;
    when 'number' then
      perform configuration_value::numeric;
      return true;
    when 'boolean' then
      return lower(configuration_value) in ('true', 'false');
    when 'date' then
      perform configuration_value::date;
      return true;
    when 'datetime' then
      perform configuration_value::timestamptz;
      return true;
    else
      return false;
  end case;
exception
  when others then
    return false;
end;
$$;

create table if not exists public.gestask_configuration (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parameter_type text not null,
  default_value text not null,
  fixed_value boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gestask_configuration_name_check check (btrim(name) <> ''),
  constraint gestask_configuration_parameter_type_check check (parameter_type in ('string', 'number', 'boolean', 'date', 'datetime')),
  constraint gestask_configuration_default_value_check check (public.is_valid_configuration_value(parameter_type, default_value))
);

create unique index if not exists gestask_configuration_name_unique_idx
  on public.gestask_configuration (lower(name));

create table if not exists public.gestask_configuration_profile (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.gestask_configuration(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(configuration_id, user_id)
);

create index if not exists gestask_configuration_profile_user_idx
  on public.gestask_configuration_profile(user_id);

create or replace function public.validate_configuration_profile_value()
returns trigger
language plpgsql
as $$
declare
  configuration_record record;
begin
  select parameter_type, default_value, fixed_value into configuration_record
  from public.gestask_configuration
  where id = new.configuration_id;

  if configuration_record.parameter_type is null then
    raise exception 'Configuration parameter does not exist';
  end if;

  if configuration_record.fixed_value then
    raise exception 'Fixed configuration parameters cannot have profile values';
  end if;

  if new.value = configuration_record.default_value then
    raise exception 'Configuration profile values must differ from the default value';
  end if;

  if not public.is_valid_configuration_value(configuration_record.parameter_type, new.value) then
    raise exception 'Invalid configuration value for parameter type %', configuration_record.parameter_type;
  end if;

  return new;
end;
$$;

drop trigger if exists gestask_configuration_touch_updated_at on public.gestask_configuration;
create trigger gestask_configuration_touch_updated_at
before update on public.gestask_configuration
for each row execute function public.touch_updated_at();

drop trigger if exists gestask_configuration_profile_touch_updated_at on public.gestask_configuration_profile;
create trigger gestask_configuration_profile_touch_updated_at
before update on public.gestask_configuration_profile
for each row execute function public.touch_updated_at();

drop trigger if exists gestask_configuration_profile_validate_value on public.gestask_configuration_profile;
create trigger gestask_configuration_profile_validate_value
before insert or update on public.gestask_configuration_profile
for each row execute function public.validate_configuration_profile_value();

alter table public.gestask_configuration enable row level security;
alter table public.gestask_configuration_profile enable row level security;

drop policy if exists "gestask_configuration_select_authenticated" on public.gestask_configuration;
create policy "gestask_configuration_select_authenticated" on public.gestask_configuration
for select using (auth.uid() is not null);

drop policy if exists "gestask_configuration_insert_authenticated" on public.gestask_configuration;
create policy "gestask_configuration_insert_authenticated" on public.gestask_configuration
for insert with check (auth.uid() is not null);

drop policy if exists "gestask_configuration_profile_select_own" on public.gestask_configuration_profile;
create policy "gestask_configuration_profile_select_own" on public.gestask_configuration_profile
for select using (auth.uid() = user_id);

drop policy if exists "gestask_configuration_profile_insert_own" on public.gestask_configuration_profile;
create policy "gestask_configuration_profile_insert_own" on public.gestask_configuration_profile
for insert with check (auth.uid() = user_id);

drop policy if exists "gestask_configuration_profile_update_own" on public.gestask_configuration_profile;
create policy "gestask_configuration_profile_update_own" on public.gestask_configuration_profile
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gestask_configuration_profile_delete_own" on public.gestask_configuration_profile;
create policy "gestask_configuration_profile_delete_own" on public.gestask_configuration_profile
for delete using (auth.uid() = user_id);
