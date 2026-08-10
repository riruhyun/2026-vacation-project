-- MVP 공식 도감입니다. 기획안 기준 30~50종까지 늘려야 완성률이 의미를 갖습니다.
-- rarity는 'common'(흔함), 'uncommon'(보통), 'rare'(드묾) 중 하나입니다.

insert into public.plants (
  korean_name,
  scientific_name,
  rarity
)
values
  ('은행나무', 'Ginkgo biloba', 'common'),
  ('민들레', 'Taraxacum officinale', 'common'),
  ('토끼풀', 'Trifolium repens', 'common')
on conflict (scientific_name) do nothing;
