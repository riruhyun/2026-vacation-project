-- 프로필 온보딩 마이그레이션
-- 처음 로그인한 사용자가 닉네임과 대표 식물 3가지를 정할 수 있게 합니다.
-- Supabase SQL Editor에서 한 번 실행하면 됩니다. 여러 번 실행해도 안전합니다.

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

alter table public.profiles
  add column if not exists featured_card_ids bigint[] not null default '{}'::bigint[];

comment on column public.profiles.onboarded_at is
  '프로필 초기 설정을 마친 시각. null이면 온보딩 화면으로 보냅니다.';
comment on column public.profiles.featured_card_ids is
  '프로필에 띄우는 대표 식물의 collection_cards.id. 최대 3개이며 순서가 표시 순서입니다.';

-- 대표 식물은 최대 3개입니다. 실제로 수집한 카드인지는 서버(app/api/profile/route.ts)에서 확인합니다.
alter table public.profiles
  drop constraint if exists profiles_featured_card_ids_check;
alter table public.profiles
  add constraint profiles_featured_card_ids_check
  check (coalesce(array_length(featured_card_ids, 1), 0) <= 3);

-- 닉네임은 사용자가 직접 정하므로 빈 문자열과 지나치게 긴 값을 막습니다.
update public.profiles
set nickname = '식물 탐험가'
where length(btrim(nickname)) = 0;

update public.profiles
set nickname = left(btrim(nickname), 20)
where length(btrim(nickname)) > 20;

alter table public.profiles
  drop constraint if exists profiles_nickname_check;
alter table public.profiles
  add constraint profiles_nickname_check
  check (length(btrim(nickname)) between 1 and 20);

-- 구글 로그인은 nickname 대신 full_name / name으로 표시 이름을 넘겨줍니다.
-- 가입 직후 닉네임 칸이 구글 이름으로 채워지도록 합니다.
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
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        '식물 탐험가'
      ),
      20
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, insert, update on public.profiles to service_role;
