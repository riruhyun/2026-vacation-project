-- 사이트 전용 비밀번호 마이그레이션
-- 가입 입구는 구글 하나입니다. 이메일/비밀번호는 "가입" 수단이 아니라
-- 이미 로그인한 사용자가 나중에 추가하는 보조 열쇠입니다.
-- Supabase SQL Editor에서 한 번 실행하면 됩니다. 여러 번 실행해도 안전합니다.

-- auth.users에는 비밀번호 설정 여부를 알려주는 필드가 없습니다.
-- (admin API 응답에도 encrypted_password는 내려오지 않습니다.)
-- 그래서 우리가 직접 기록합니다. GoTrue 내부 동작을 추측하지 않아도 됩니다.
alter table public.profiles
  add column if not exists has_site_password boolean not null default false;

comment on column public.profiles.has_site_password is
  '사이트 전용 비밀번호를 설정했으면 true. false면 구글로만 로그인할 수 있습니다.';
