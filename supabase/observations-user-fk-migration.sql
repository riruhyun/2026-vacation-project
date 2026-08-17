-- observations.user_id 외래키 복구. 기존 Supabase 프로젝트에 한 번 실행합니다.
--
-- schema.sql은 처음부터 이렇게 선언해 왔습니다.
--   user_id uuid not null references public.profiles(id) on delete cascade
-- 그런데 실제 DB에는 이 제약이 없습니다. create table if not exists로 만드는 테이블은
-- 이미 존재하면 그대로 넘어가므로, 뒤에 손본 선언이 반영되지 않은 것입니다.
--
-- 그래서 지금은 이렇습니다.
--   1. 계정을 지워도 그 사람의 관찰 기록이 남습니다. cascade가 없어서입니다.
--   2. 존재하지 않는 user_id로도 관찰이 저장됩니다.
--
-- 새 테이블도, 새 열도 없습니다. 제약 하나만 붙이므로 코드는 고칠 필요가 없습니다.
-- observation_collection_matches와 user_collection_counts의 외래키는
-- 확인해 보니 정상이라 건드리지 않습니다.

-- 제약을 붙이기 전에 고아 기록을 먼저 치웁니다. 남아 있으면 제약 추가가 실패합니다.
-- 프로필이 없는 관찰은 아무도 볼 수 없으면서 통계에만 잡히는 데이터입니다.
--
-- 주의: 지우는 것은 DB 행뿐입니다. observations 버킷의 사진 파일은 그대로 남습니다.
-- 지운 건수가 0이 아니면 스토리지도 따로 정리해야 합니다.
do $$
declare
  orphan_count integer;
begin
  select count(*) into orphan_count
  from public.observations as observation
  where not exists (
    select 1
    from public.profiles as profile
    where profile.id = observation.user_id
  );

  if orphan_count > 0 then
    raise notice '프로필이 없는 관찰 %건을 지웁니다.', orphan_count;

    delete from public.observations as observation
    where not exists (
      select 1
      from public.profiles as profile
      where profile.id = observation.user_id
    );
  else
    raise notice '고아 관찰이 없습니다. 지울 것이 없습니다.';
  end if;
end $$;

-- 이미 제약이 붙은 프로젝트에서도 다시 실행할 수 있게 확인한 뒤 추가합니다.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.observations'::regclass
      and contype = 'f'
      and confrelid = 'public.profiles'::regclass
      and pg_get_constraintdef(oid) like '%(user_id)%'
  ) then
    raise notice 'observations.user_id 외래키가 이미 있습니다. 넘어갑니다.';
  else
    alter table public.observations
      add constraint observations_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade;

    raise notice 'observations.user_id 외래키를 추가했습니다.';
  end if;
end $$;
