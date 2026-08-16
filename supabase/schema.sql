create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '식물 탐험가',
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scientific_name text not null,
  display_name text not null,
  image_path text not null,
  observed_at timestamptz not null default now()
);

create index if not exists observations_user_id_idx
  on public.observations(user_id);

create index if not exists observations_user_scientific_name_idx
  on public.observations(user_id, scientific_name);

create table if not exists public.user_plant_counts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  scientific_name text not null,
  count integer not null default 1 check (count >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, scientific_name)
);

create or replace function public.level_from_xp(total_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  current_level integer := 1;
  remaining_xp integer := greatest(total_xp, 0);
  required_xp integer := 100;
begin
  while remaining_xp >= required_xp loop
    remaining_xp := remaining_xp - required_xp;
    current_level := current_level + 1;
    required_xp := 100 + (current_level - 1) * 50;
  end loop;

  return current_level;
end;
$$;

create or replace function public.record_observation_reward(
  p_user_id uuid,
  p_scientific_name text,
  p_display_name text,
  p_image_path text,
  p_base_xp integer
)
returns table (
  observation_id uuid,
  observed_at timestamptz,
  plant_count integer,
  xp_awarded integer,
  total_xp integer,
  user_level integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_count integer;
  new_count integer;
  reward integer;
  new_total_xp integer;
  new_level integer;
  new_observation_id uuid;
  new_observed_at timestamptz;
begin
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select coalesce((
    select count
    from public.user_plant_counts
    where user_id = p_user_id
      and scientific_name = p_scientific_name
  ), 0) into previous_count;

  reward := case
    when p_base_xp <= 0 then 0
    else greatest(
      5,
      round(p_base_xp / power(2::numeric, previous_count))::integer
    )
  end;

  insert into public.user_plant_counts (
    user_id,
    scientific_name,
    count,
    updated_at
  )
  values (p_user_id, p_scientific_name, 1, now())
  on conflict (user_id, scientific_name) do update set
    count = public.user_plant_counts.count + 1,
    updated_at = now()
  returning count into new_count;

  update public.profiles
  set
    xp = xp + reward,
    level = public.level_from_xp(xp + reward),
    updated_at = now()
  where id = p_user_id
  returning xp, level into new_total_xp, new_level;

  insert into public.observations (
    user_id,
    scientific_name,
    display_name,
    image_path
  )
  values (p_user_id, p_scientific_name, p_display_name, p_image_path)
  returning id, observations.observed_at
  into new_observation_id, new_observed_at;

  return query select
    new_observation_id,
    new_observed_at,
    new_count,
    reward,
    new_total_xp,
    new_level;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', '식물 탐험가')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.observations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_plant_counts enable row level security;

revoke all on public.observations from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.user_plant_counts from anon, authenticated;
revoke all on function public.record_observation_reward(uuid, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.record_observation_reward(uuid, text, text, text, integer)
  to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'observations',
  'observations',
  true,
  6291456,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
