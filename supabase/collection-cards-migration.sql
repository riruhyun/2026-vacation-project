create table if not exists public.collection_cards (
  id bigint primary key,
  display_name text not null check (length(btrim(display_name)) > 0),
  scientific_name text not null check (length(btrim(scientific_name)) > 0),
  stage smallint not null check (stage between 1 and 3),
  rarity text not null check (rarity in ('common', 'uncommon', 'rare')),
  representative_plant_pilbk_no text,
  genus_name text,
  genus_korean_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_card_matchers (
  id bigint generated always as identity primary key,
  collection_card_id bigint not null
    references public.collection_cards(id) on delete cascade,
  taxon_rank text not null check (taxon_rank in ('species', 'genus')),
  taxon_name text not null check (length(btrim(taxon_name)) > 0),
  normalized_taxon_name text generated always as (lower(btrim(taxon_name))) stored,
  created_at timestamptz not null default now(),
  unique (taxon_rank, normalized_taxon_name)
);

create index if not exists collection_card_matchers_card_id_idx
  on public.collection_card_matchers(collection_card_id);

create table if not exists public.observation_collection_matches (
  observation_id uuid primary key
    references public.observations(id) on delete cascade,
  collection_card_id bigint
    references public.collection_cards(id) on delete restrict,
  identified_scientific_name text not null
    check (length(btrim(identified_scientific_name)) > 0),
  identified_genus_name text,
  identification_score numeric,
  candidates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  check (
    identification_score is null
    or identification_score between 0 and 1
  ),
  check (jsonb_typeof(candidates) = 'array')
);

create index if not exists observation_collection_matches_card_id_idx
  on public.observation_collection_matches(collection_card_id);

create table if not exists public.user_collection_counts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  collection_card_id bigint not null
    references public.collection_cards(id) on delete cascade,
  count integer not null default 1 check (count >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection_card_id)
);

create index if not exists user_collection_counts_card_id_idx
  on public.user_collection_counts(collection_card_id);

alter table public.collection_cards disable row level security;
alter table public.collection_card_matchers disable row level security;
alter table public.observation_collection_matches disable row level security;
alter table public.user_collection_counts disable row level security;

revoke all on public.collection_cards from public, anon, authenticated;
revoke all on public.collection_card_matchers from public, anon, authenticated;
revoke all on public.observation_collection_matches from public, anon, authenticated;
revoke all on public.user_collection_counts from public, anon, authenticated;

grant select on public.collection_cards to service_role;
grant select on public.collection_card_matchers to service_role;
grant select, insert on public.observation_collection_matches to service_role;
grant select, insert, update on public.user_collection_counts to service_role;
grant usage, select on sequence public.collection_card_matchers_id_seq
  to service_role;

insert into public.collection_cards (
  id,
  display_name,
  scientific_name,
  stage,
  rarity,
  representative_plant_pilbk_no,
  genus_name,
  genus_korean_name
)
values
  (1, '질경이', 'Plantago asiatica', 1, 'common', null, 'Plantago', null),
  (2, '괭이밥', 'Oxalis corniculata', 1, 'common', null, 'Oxalis', null),
  (3, '개망초', 'Erigeron annuus', 1, 'common', null, 'Erigeron', null),
  (4, '강아지풀', 'Setaria viridis', 1, 'common', null, 'Setaria', null),
  (5, '쇠비름', 'Portulaca oleracea', 1, 'common', null, 'Portulaca', null),
  (6, '달맞이꽃', 'Oenothera biennis', 1, 'common', null, 'Oenothera', null),
  (7, '토끼풀', 'Trifolium repens', 1, 'common', null, 'Trifolium', null),
  (8, '닭의장풀', 'Commelina communis', 1, 'common', null, 'Commelina', null),
  (9, '명아주', 'Chenopodium album', 1, 'common', null, 'Chenopodium', null),
  (10, '바랭이', 'Digitaria ciliaris', 1, 'common', null, 'Digitaria', null),
  (11, '왕바랭이', 'Eleusine indica', 1, 'common', null, 'Eleusine', null),
  (12, '냉이', 'Capsella bursa-pastoris', 1, 'common', null, 'Capsella', null),
  (13, '별꽃', 'Stellaria media', 1, 'common', null, 'Stellaria', null),
  (14, '민들레', 'Taraxacum', 1, 'common', '30161', 'Taraxacum', '민들레속'),
  (15, '개쑥갓', 'Senecio vulgaris', 1, 'common', null, 'Senecio', null),
  (16, '깨풀', 'Acalypha australis', 1, 'common', null, 'Acalypha', null),
  (17, '제비꽃', 'Viola mandshurica', 2, 'uncommon', null, 'Viola', null),
  (18, '꽃마리', 'Trigonotis peduncularis', 2, 'uncommon', null, 'Trigonotis', null),
  (19, '주름잎', 'Mazus pumilus', 2, 'uncommon', null, 'Mazus', null),
  (20, '국수나무', 'Neillia incisa', 2, 'uncommon', null, 'Neillia', null),
  (21, '사상자', 'Torilis japonica', 2, 'uncommon', null, 'Torilis', null),
  (22, '애기메꽃', 'Calystegia hederacea', 2, 'uncommon', null, 'Calystegia', null),
  (23, '개여뀌', 'Persicaria longiseta', 2, 'uncommon', null, 'Persicaria', null),
  (24, '여뀌', 'Persicaria hydropiper', 2, 'uncommon', null, 'Persicaria', null),
  (25, '환삼덩굴', 'Humulus scandens', 2, 'uncommon', null, 'Humulus', null),
  (26, '머위', 'Petasites japonicus', 2, 'uncommon', null, 'Petasites', null),
  (27, '약모밀', 'Houttuynia cordata', 2, 'uncommon', null, 'Houttuynia', null),
  (28, '갈퀴덩굴', 'Galium spurium', 2, 'uncommon', null, 'Galium', null),
  (29, '미국가막사리', 'Bidens frondosa', 2, 'uncommon', null, 'Bidens', null),
  (30, '뱀딸기', 'Potentilla indica', 3, 'rare', null, 'Potentilla', null),
  (31, '산박하', 'Isodon inflexus', 3, 'rare', null, 'Isodon', null),
  (32, '고마리', 'Persicaria thunbergii', 3, 'rare', null, 'Persicaria', null),
  (33, '물봉선', 'Impatiens textorii', 3, 'rare', null, 'Impatiens', null),
  (34, '도깨비바늘', 'Bidens bipinnata', 3, 'rare', null, 'Bidens', null),
  (35, '며느리밑씻개', 'Persicaria senticosa', 3, 'rare', null, 'Persicaria', null),
  (36, '큰개불알풀', 'Veronica persica', 3, 'rare', null, 'Veronica', null),
  (37, '며느리배꼽', 'Persicaria perfoliata', 3, 'rare', null, 'Persicaria', null),
  (38, '털여뀌', 'Persicaria orientalis', 3, 'rare', null, 'Persicaria', null),
  (39, '흰여뀌', 'Persicaria lapathifolia', 3, 'rare', null, 'Persicaria', null),
  (40, '미꾸리낚시', 'Persicaria sagittata', 3, 'rare', null, 'Persicaria', null),
  (41, '이삭여뀌', 'Persicaria filiformis', 3, 'rare', null, 'Persicaria', null),
  (42, '갈퀴나물', 'Vicia amoena', 3, 'rare', null, 'Vicia', null),
  (43, '이질풀', 'Geranium thunbergii', 3, 'rare', null, 'Geranium', null),
  (44, '쥐오줌풀', 'Valeriana fauriei', 3, 'rare', null, 'Valeriana', null),
  (45, '벌개미취', 'Aster koraiensis', 3, 'rare', null, 'Aster', null),
  (46, '개미취', 'Aster tataricus', 3, 'rare', null, 'Aster', null),
  (47, '참취', 'Aster scaber', 3, 'rare', null, 'Aster', null),
  (48, '짚신나물', 'Agrimonia pilosa', 3, 'rare', null, 'Agrimonia', null),
  (49, '미나리', 'Oenanthe javanica', 3, 'rare', null, 'Oenanthe', null),
  (50, '배초향', 'Agastache rugosa', 3, 'rare', null, 'Agastache', null)
on conflict (id) do update set
  display_name = excluded.display_name,
  scientific_name = excluded.scientific_name,
  stage = excluded.stage,
  rarity = excluded.rarity,
  representative_plant_pilbk_no = excluded.representative_plant_pilbk_no,
  genus_name = excluded.genus_name,
  genus_korean_name = excluded.genus_korean_name,
  is_active = true,
  updated_at = now();

insert into public.collection_card_matchers (
  collection_card_id,
  taxon_rank,
  taxon_name
)
values
  (1, 'species', 'Plantago asiatica'),
  (2, 'species', 'Oxalis corniculata'),
  (3, 'species', 'Erigeron annuus'),
  (4, 'species', 'Setaria viridis'),
  (5, 'species', 'Portulaca oleracea'),
  (6, 'species', 'Oenothera biennis'),
  (7, 'species', 'Trifolium repens'),
  (8, 'species', 'Commelina communis'),
  (9, 'species', 'Chenopodium album'),
  (10, 'species', 'Digitaria ciliaris'),
  (11, 'species', 'Eleusine indica'),
  (12, 'species', 'Capsella bursa-pastoris'),
  (13, 'species', 'Stellaria media'),
  (14, 'genus', 'Taraxacum'),
  (15, 'species', 'Senecio vulgaris'),
  (16, 'species', 'Acalypha australis'),
  (17, 'species', 'Viola mandshurica'),
  (18, 'species', 'Trigonotis peduncularis'),
  (19, 'species', 'Mazus pumilus'),
  (20, 'species', 'Neillia incisa'),
  (21, 'species', 'Torilis japonica'),
  (22, 'species', 'Calystegia hederacea'),
  (23, 'species', 'Persicaria longiseta'),
  (24, 'species', 'Persicaria hydropiper'),
  (25, 'species', 'Humulus scandens'),
  (26, 'species', 'Petasites japonicus'),
  (27, 'species', 'Houttuynia cordata'),
  (28, 'species', 'Galium spurium'),
  (29, 'species', 'Bidens frondosa'),
  (30, 'species', 'Potentilla indica'),
  (31, 'species', 'Isodon inflexus'),
  (32, 'species', 'Persicaria thunbergii'),
  (33, 'species', 'Impatiens textorii'),
  (34, 'species', 'Bidens bipinnata'),
  (35, 'species', 'Persicaria senticosa'),
  (36, 'species', 'Veronica persica'),
  (37, 'species', 'Persicaria perfoliata'),
  (38, 'species', 'Persicaria orientalis'),
  (39, 'species', 'Persicaria lapathifolia'),
  (40, 'species', 'Persicaria sagittata'),
  (41, 'species', 'Persicaria filiformis'),
  (42, 'species', 'Vicia amoena'),
  (43, 'species', 'Geranium thunbergii'),
  (44, 'species', 'Valeriana fauriei'),
  (45, 'species', 'Aster koraiensis'),
  (46, 'species', 'Aster tataricus'),
  (47, 'species', 'Aster scaber'),
  (48, 'species', 'Agrimonia pilosa'),
  (49, 'species', 'Oenanthe javanica'),
  (50, 'species', 'Agastache rugosa')
on conflict (taxon_rank, normalized_taxon_name) do update set
  collection_card_id = excluded.collection_card_id,
  taxon_name = excluded.taxon_name;

create or replace function public.record_collection_observation_reward(
  p_user_id uuid,
  p_collection_card_id bigint,
  p_identified_scientific_name text,
  p_identified_genus_name text,
  p_display_name text,
  p_image_path text,
  p_identification_score numeric,
  p_candidates jsonb,
  p_base_xp integer
)
returns table (
  observation_id uuid,
  observed_at timestamptz,
  collection_count integer,
  xp_awarded integer,
  total_xp integer,
  user_level integer,
  collection_display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_count integer;
  new_count integer;
  reward integer;
  new_total_xp integer;
  new_level integer;
  new_observation_id uuid;
  new_observed_at timestamptz;
  effective_display_name text;
begin
  if nullif(btrim(p_identified_scientific_name), '') is null then
    raise exception 'SCIENTIFIC_NAME_REQUIRED';
  end if;

  if p_identification_score is not null
    and (p_identification_score < 0 or p_identification_score > 1) then
    raise exception 'INVALID_IDENTIFICATION_SCORE';
  end if;

  if coalesce(jsonb_typeof(p_candidates), 'array') <> 'array' then
    raise exception 'INVALID_CANDIDATES';
  end if;

  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  -- 애플리케이션(lib/progress.ts)이 계산한 XP를 그대로 적립합니다.
  reward := greatest(coalesce(p_base_xp, 0), 0);

  if p_collection_card_id is not null then
    select display_name
    into effective_display_name
    from public.collection_cards
    where id = p_collection_card_id
      and is_active = true;

    if not found then
      raise exception 'COLLECTION_CARD_NOT_FOUND';
    end if;

    insert into public.user_collection_counts (
      user_id,
      collection_card_id,
      count,
      updated_at
    )
    values (p_user_id, p_collection_card_id, 1, now())
    on conflict (user_id, collection_card_id) do update set
      count = public.user_collection_counts.count + 1,
      updated_at = now()
    returning count into new_count;
  else
    effective_display_name := nullif(btrim(p_display_name), '');
    if effective_display_name is null then
      raise exception 'DISPLAY_NAME_REQUIRED';
    end if;

    select count(*)::integer
    into previous_count
    from public.observations as observation
    join public.observation_collection_matches as match
      on match.observation_id = observation.id
    where observation.user_id = p_user_id
      and match.collection_card_id is null
      and lower(match.identified_scientific_name) =
        lower(btrim(p_identified_scientific_name));

    new_count := previous_count + 1;
  end if;

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
  values (
    p_user_id,
    btrim(p_identified_scientific_name),
    effective_display_name,
    p_image_path
  )
  returning id, observations.observed_at
  into new_observation_id, new_observed_at;

  insert into public.observation_collection_matches (
    observation_id,
    collection_card_id,
    identified_scientific_name,
    identified_genus_name,
    identification_score,
    candidates
  )
  values (
    new_observation_id,
    p_collection_card_id,
    btrim(p_identified_scientific_name),
    nullif(btrim(p_identified_genus_name), ''),
    p_identification_score,
    coalesce(p_candidates, '[]'::jsonb)
  );

  return query select
    new_observation_id,
    new_observed_at,
    new_count,
    reward,
    new_total_xp,
    new_level,
    effective_display_name;
end;
$$;

revoke execute on function public.record_collection_observation_reward(
  uuid, bigint, text, text, text, text, numeric, jsonb, integer
) from public, anon, authenticated;

grant execute on function public.record_collection_observation_reward(
  uuid, bigint, text, text, text, text, numeric, jsonb, integer
) to service_role;
