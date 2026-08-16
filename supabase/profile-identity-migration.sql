-- 닉네임 중복 차단과 프로필 사진 추가. 기존 Supabase 프로젝트에 한 번 실행합니다.
--
-- 새로 만드는 테이블은 없습니다.
--   1. profiles에 avatar_path 열 하나를 추가합니다.
--      프로필 사진은 전용 avatars 버킷에 사용자별 폴더로 저장하고, 열에는 경로만 둡니다.
--   2. 닉네임은 대소문자를 무시하고 고유해야 합니다. 사칭을 막기 위해서입니다.
--   3. 회원가입에서 항상 닉네임을 받으므로 '식물 탐험가' 기본값을 없앱니다.
--
-- 이미 중복된 닉네임이 있으면 먼저 만들어진 계정이 이름을 지키고,
-- 나중에 만들어진 쪽에만 id 앞 8자리를 붙여 갈라둡니다.

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  alter column nickname drop default;

-- 앞뒤 공백만 다른 닉네임도 같은 이름으로 취급하기 위해 먼저 정리합니다.
update public.profiles
set nickname = btrim(nickname)
where nickname <> btrim(nickname);

with ranked as (
  select
    id,
    nickname,
    row_number() over (
      partition by lower(nickname)
      order by created_at, id
    ) as position
  from public.profiles
)
update public.profiles as profile
set
  nickname = ranked.nickname || '-' || left(profile.id::text, 8),
  updated_at = now()
from ranked
where ranked.id = profile.id
  and ranked.position > 1;

create unique index if not exists profiles_nickname_unique_idx
  on public.profiles (lower(nickname));

-- 앱 밖(대시보드 등)에서 만든 계정도 고유한 이름을 갖도록 대비값을 바꿉니다.
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
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
      '탐험가-' || left(new.id::text, 8)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 프로필 사진 전용 버킷입니다. 대시보드에서 이미 만들었다면 설정만 맞춰집니다.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  6291456,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
