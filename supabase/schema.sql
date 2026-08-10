create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '식물 탐험가',
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plants (
  id bigint generated always as identity primary key,
  korean_name text not null,
  scientific_name text not null unique,
  rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare')),
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plant_id bigint references public.plants(id) on delete set null,
  scientific_name text not null,
  display_name text not null,
  image_path text not null,
  observed_at timestamptz not null default now()
);

create index if not exists observations_user_id_idx
  on public.observations(user_id);

create index if not exists observations_user_plant_idx
  on public.observations(user_id, plant_id);

alter table public.plants enable row level security;
alter table public.observations enable row level security;
alter table public.profiles enable row level security;

revoke all on public.plants from anon, authenticated;
revoke all on public.observations from anon, authenticated;
revoke all on public.profiles from anon, authenticated;

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
