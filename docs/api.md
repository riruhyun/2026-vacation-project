# 초록도감 API

모든 응답은 아래 두 형식 중 하나입니다. 공통 형식은 `lib/server/http.ts` 한 곳에서 바꿀 수 있습니다.

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "오류 내용" } }
```

## 데이터 구성

- 공식 도감 50종: `data/plants.ts`
- 식별: Pl@ntNet
- 한국 이름과 설명: 산림청 국립수목원 API
- 사용자 XP, 레벨, 식물별 발견 횟수와 관찰 기록: Supabase

공식 식물 목록은 작고 고정되어 있으므로 Supabase `plants` 테이블이나 seed를 사용하지 않습니다. 학명이 목록과 정확히 같은지만 서버 메모리에서 확인합니다.

기존 Supabase 프로젝트에는 SQL Editor에서 `supabase/progress-migration.sql`을 한 번 실행해야 합니다. 새 프로젝트는 `supabase/schema.sql`을 실행합니다.

## 경험치와 레벨

경험치 규칙은 전부 `lib/progress.ts`에 있습니다. 기본 경험치에 조건별 보너스를 더하는 구조입니다.

| 조건 | XP |
| --- | ---: |
| 유효한 관찰 | +10 |
| 처음 발견한 종 | +90 |
| 흔함 희귀도 | +0 |
| 보통 희귀도 | +25 |
| 드묾 희귀도 | +50 |

첫 발견 보너스와 희귀도 보너스는 도감 카드를 **처음 등록할 때만 한 번** 지급합니다. 희귀 식물만 반복 촬영해 레벨을 올릴 수 없게 하기 위해서입니다.

| 상황 | 계산 | 최종 XP |
| --- | --- | ---: |
| 흔한 식물 첫 발견 | 10 + 90 + 0 | 100 |
| 보통 식물 첫 발견 | 10 + 90 + 25 | 125 |
| 드문 식물 첫 발견 | 10 + 90 + 50 | 150 |
| 이미 모은 식물 재관찰 | 10 | 10 |
| 같은 날 같은 종 추가 촬영 | – | 0 |
| 도감 밖 기타 식물 | 10 | 10 |

기타 식물은 도감에 등록되지 않으므로 첫 발견·희귀도 보너스 없이 기본 관찰 XP만 받습니다. "같은 날"의 기준은 한국 시간 자정입니다.

레벨 1에서 2는 100 XP가 필요합니다. 이후 레벨마다 요구량이 50 XP씩 증가합니다.

- `Lv.N → Lv.N+1 필요 XP = 100 + 50 × (N - 1)` → `100 → 150 → 200 → 250 …`
- `Lv.N 도달 누적 XP = 100(N-1) + 25(N-1)(N-2)` → Lv.10은 누적 2,700 XP

저장하는 값은 누적 XP 하나뿐입니다. 레벨과 현재 구간 진행도는 누적 XP에서 파생합니다. 예를 들어 누적 380 XP는 `Lv.3 · 130 / 200 XP`로 표시합니다.

XP는 서버(`app/api/observations/route.ts`)에서만 계산하고, Supabase 함수 `record_collection_observation_reward`는 계산된 값을 그대로 적립하면서 발견 횟수, 누적 XP, 레벨, 관찰 기록을 한 트랜잭션에서 함께 갱신합니다.

기존 Supabase 프로젝트는 `supabase/xp-rebalance-migration.sql`을 한 번 실행하세요. 새 테이블은 만들지 않고 기존 함수 두 개의 본문만 교체하며, 시그니처가 그대로라 호출하는 쪽은 수정이 필요 없습니다.

## 프론트에서 호출하기

화면에서는 직접 `fetch`를 만들지 않고 `lib/api.ts`의 함수를 사용할 수 있습니다.

```ts
import { identifyPlant, saveObservation } from '@/lib/api'

const { candidates } = await identifyPlant(image)
const picked = candidates[0]

const saved = await saveObservation({
  image,
  plantId: picked.plantId,
  scientificName: picked.scientificName,
  displayName: picked.koreanName,
})

console.log(saved.result) // new 또는 duplicate
console.log(saved.reward) // xp, totalXp, level, leveledUp, plantCount
```

인증 연결 전 사용자 구분은 `x-user-id` 헤더를 사용합니다. `lib/api.ts`에서는 다음 한 줄로 설정합니다.

```ts
import { setUserId } from '@/lib/api'

setUserId('Supabase Auth 사용자 UUID')
```

## POST /api/identify

`multipart/form-data`로 JPG 또는 PNG `image` 파일 하나를 보냅니다. 최대 크기는 6MB입니다.

선택한 식물 부위는 `organ` 필드로 함께 보낼 수 있습니다. 허용값은 `flower`, `leaf`, `fruit`이며, `auto`이거나 필드를 생략하면 Pl@ntNet 자동 판별을 사용합니다.

처리 순서는 다음과 같습니다.

`사진 → Pl@ntNet 후보 3개 → 학명 → 공식 50종 확인 → 산림청 한국 이름·설명`

공식 목록과 학명이 정확히 일치하면 `plantId`, `stage`, `rarity`가 들어갑니다. 일치하지 않으면 각각 `null`이며 기타 식물로 처리합니다.

## POST /api/observations

`x-user-id`와 `multipart/form-data`가 필요합니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `image` | O | 관찰 이미지 |
| `plantId` | 조건부 | 공식 식물 ID |
| `scientificName` | 조건부 | 기타 식물일 때 필요 |
| `displayName` | 조건부 | 기타 식물일 때 필요 |

응답 예시는 다음과 같습니다.

```json
{
  "success": true,
  "data": {
    "result": "new",
    "observation": {},
    "reward": {
      "xp": 125,
      "breakdown": [
        { "type": "observation", "label": "관찰", "xp": 10 },
        { "type": "first_discovery", "label": "첫 발견", "xp": 90 },
        { "type": "rarity_uncommon", "label": "보통 희귀도", "xp": 25 }
      ],
      "totalXp": 425,
      "level": 3,
      "currentLevelXp": 175,
      "xpToNextLevel": 200,
      "leveledUp": true,
      "plantCount": 1
    }
  }
}
```

## 조회 API

- `GET /api/collection`: 공식 50종의 수집 여부와 식물별 발견 횟수, 기타 발견 목록
- `GET /api/plants/:id`: 로컬 공식 목록과 산림청 설명, 해당 사용자의 관찰 기록
- `GET /api/profile`: 닉네임, 누적 XP, 레벨, 현재 레벨 XP, 다음 레벨 요구 XP, 수집 통계
- `GET /api/health`: 환경변수 설정 여부 확인. 외부 API 요청은 보내지 않음

사용자별 API는 `x-user-id`가 필요합니다. 실제 로그인 연결 시 `lib/server/user.ts`와 `lib/api.ts`의 사용자 헤더 부분만 Supabase Auth 세션으로 교체하면 됩니다.
