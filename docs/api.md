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

첫 발견 경험치는 단계별로 다릅니다.

| 단계 | 희귀도 | 첫 발견 XP |
| --- | --- | ---: |
| 1 | common | 50 |
| 2 | uncommon | 90 |
| 3 | rare | 140 |

같은 식물을 다시 발견하면 이전 보상의 절반을 반올림해 지급하며, 최소 보상은 5 XP입니다.

- 1단계: `50 → 25 → 13 → 6 → 5 …`
- 2단계: `90 → 45 → 23 → 11 → 6 → 5 …`
- 3단계: `140 → 70 → 35 → 18 → 9 → 5 …`
- 공식 50종 이외의 기타 식물: `0 XP`, 발견 횟수만 증가

레벨 1에서 2는 400 XP가 필요합니다. 이후 레벨마다 요구량이 50 XP씩 증가합니다.

`400 → 450 → 500 → 550 …`

저장 시 Supabase 함수 `record_observation_reward`가 발견 횟수, XP, 레벨과 관찰 기록을 한 트랜잭션에서 함께 갱신합니다.

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
    "result": "duplicate",
    "observation": {},
    "reward": {
      "xp": 25,
      "totalXp": 425,
      "level": 2,
      "leveledUp": true,
      "plantCount": 2
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
