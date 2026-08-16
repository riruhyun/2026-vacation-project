-- 경험치·레벨 밸런스 조정. 기존 Supabase 프로젝트에 한 번 실행합니다.
--
-- 새 테이블은 만들지 않고 기존 함수 두 개의 본문만 교체합니다. 시그니처가 그대로라
-- 이 함수를 호출하는 다른 코드는 수정 없이 그대로 동작합니다.
--
-- 바뀌는 점
--   1. XP 계산 위치: p_base_xp를 함수 안에서 절반씩 깎던 로직을 제거합니다.
--      이제 애플리케이션(lib/progress.ts)이 확정한 XP를 그대로 적립합니다.
--      기본 관찰 +10 / 첫 발견 +90 / 보통 +25 / 드묾 +50 규칙은 모두 앱에 있습니다.
--   2. 레벨 곡선: 레벨 1→2 요구량을 400에서 100으로 낮춥니다.
--      Lv.N → Lv.N+1 필요 XP = 100 + 50 x (N - 1)

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

-- p_base_xp는 이제 "이번 관찰로 지급할 최종 XP"입니다.
-- (파라미터 이름은 create or replace로 바꿀 수 없어 그대로 둡니다.)
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

  -- 애플리케이션이 계산한 XP를 그대로 적립합니다.
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

-- 누적 XP는 그대로 두고 레벨만 새 곡선으로 다시 계산합니다.
update public.profiles
set level = public.level_from_xp(xp);
