create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  plant_key text not null,
  collection_card_id bigint
    references public.collection_cards(id) on delete cascade,
  scientific_name text,
  display_name text,
  level integer,
  created_at timestamptz not null default now()
);

alter table public.activity_logs
  drop constraint if exists activity_logs_type_check;
alter table public.activity_logs
  drop constraint if exists activity_logs_check;
alter table public.activity_logs
  drop constraint if exists activity_logs_payload_check;

delete from public.activity_logs
where type = 'level_3';

alter table public.activity_logs
  add constraint activity_logs_type_check
  check (type in ('new_plant', 'level_up'));
alter table public.activity_logs
  add constraint activity_logs_payload_check
  check (
    (type = 'new_plant' and scientific_name is not null)
    or (type = 'level_up' and level is not null)
  );

create unique index if not exists activity_logs_new_plant_unique
  on public.activity_logs(user_id, plant_key)
  where type = 'new_plant';

drop index if exists public.activity_logs_level_3_unique;
create unique index if not exists activity_logs_level_up_unique
  on public.activity_logs(user_id, level)
  where type = 'level_up';

create index if not exists activity_logs_user_created_at_idx
  on public.activity_logs(user_id, created_at desc);

alter table public.activity_logs disable row level security;
revoke all on public.activity_logs from public, anon, authenticated;
grant select, insert on public.activity_logs to service_role;

create or replace function public.log_new_plant_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  observation public.observations%rowtype;
begin
  select * into observation
  from public.observations
  where id = new.observation_id;

  insert into public.activity_logs (
    user_id,
    type,
    plant_key,
    collection_card_id,
    scientific_name,
    display_name,
    created_at
  )
  values (
    observation.user_id,
    'new_plant',
    case
      when new.collection_card_id is not null
        then 'card:' || new.collection_card_id::text
      else 'species:' || lower(btrim(new.identified_scientific_name))
    end,
    new.collection_card_id,
    new.identified_scientific_name,
    observation.display_name,
    observation.observed_at
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists observation_new_plant_activity
  on public.observation_collection_matches;
create trigger observation_new_plant_activity
after insert on public.observation_collection_matches
for each row execute function public.log_new_plant_activity();

drop trigger if exists profile_level_3_activity on public.profiles;
drop trigger if exists profile_level_activity on public.profiles;
drop function if exists public.log_level_3_activity();

create or replace function public.log_level_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_level integer;
begin
  if tg_op = 'INSERT' then
    previous_level := 0;
  else
    previous_level := old.level;
  end if;

  with recursive milestones(level, gap) as (
    values (1, 6)
    union all
    select level + gap, gap + 2
    from milestones
    where level + gap <= new.level
  )
  insert into public.activity_logs (
    user_id,
    type,
    plant_key,
    level,
    created_at
  )
  select
    new.id,
    'level_up',
    'level:' || milestones.level::text,
    milestones.level,
    new.updated_at
  from milestones
  where milestones.level > previous_level
  on conflict do nothing;

  return new;
end;
$$;

create trigger profile_level_activity
after insert or update of level on public.profiles
for each row execute function public.log_level_activity();

with first_discoveries as (
  select distinct on (observation.user_id, plant_key)
    observation.user_id,
    case
      when match.collection_card_id is not null
        then 'card:' || match.collection_card_id::text
      else 'species:' || lower(btrim(match.identified_scientific_name))
    end as plant_key,
    match.collection_card_id,
    match.identified_scientific_name,
    observation.display_name,
    observation.observed_at
  from public.observations as observation
  join public.observation_collection_matches as match
    on match.observation_id = observation.id
  order by observation.user_id, plant_key, observation.observed_at
)
insert into public.activity_logs (
  user_id,
  type,
  plant_key,
  collection_card_id,
  scientific_name,
  display_name,
  created_at
)
select
  user_id,
  'new_plant',
  plant_key,
  collection_card_id,
  identified_scientific_name,
  display_name,
  observed_at
from first_discoveries
on conflict do nothing;

with recursive milestones(level, gap) as (
  values (1, 6)
  union all
  select level + gap, gap + 2
  from milestones
  where level + gap <= coalesce((select max(level) from public.profiles), 0)
)
insert into public.activity_logs (
  user_id,
  type,
  plant_key,
  level,
  created_at
)
select
  profile.id,
  'level_up',
  'level:' || milestones.level::text,
  milestones.level,
  profile.updated_at
from public.profiles as profile
join milestones on milestones.level <= profile.level
on conflict do nothing;
