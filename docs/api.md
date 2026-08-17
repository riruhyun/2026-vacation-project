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

## 인증

Supabase Auth 세션 쿠키를 사용합니다. `/api/auth/sign-in`이나 `/api/auth/sign-up`이 성공하면 쿠키가 설정되고, 이후 요청에는 브라우저가 자동으로 함께 보냅니다. 프론트에서 따로 헤더를 붙일 일은 없습니다.

서버에서는 `lib/server/user.ts`의 `userIdFromSession()`이 세션에서 사용자 UUID를 꺼냅니다. 세션이 없으면 각 API가 401을 돌려줍니다.

아래 표에서 "인증 필요"로 표시된 엔드포인트가 이 세션을 요구합니다.

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

## 인증 API

### POST /api/auth/sign-up

닉네임, 이메일, 비밀번호를 **한 요청에 함께** 보냅니다. 화면에서 세 칸을 다 채운 뒤 한 번만 호출하면 됩니다.

```json
{ "nickname": "초록탐험가", "email": "me@example.com", "password": "비밀번호" }
```

닉네임 규칙은 `lib/nickname.ts`에 있습니다.

| 규칙 | 내용 |
| --- | --- |
| 길이 | 2자 이상 16자 이하 |
| 공백 | 앞뒤 공백은 제거하고, 사이의 연속 공백은 하나로 줄임 |
| 중복 | **대소문자를 무시하고 중복 불가.** 사칭을 막기 위해서입니다 |
| 제어 문자 | 줄바꿈 등은 사용 불가 |

중복된 닉네임이면 409와 함께 `이미 사용 중인 닉네임이에요.`를 돌려줍니다. 마지막 방어선은 `profiles(lower(nickname))` 고유 인덱스라, 동시에 같은 이름으로 가입해도 한 명만 성공합니다.

닉네임은 `auth.users`의 메타데이터로 넘어가고, `handle_new_user` 트리거가 `profiles`에 씁니다. 서버가 `profiles`에 따로 insert하지 않습니다.

### POST /api/auth/sign-in

```json
{ "email": "me@example.com", "password": "비밀번호" }
```

### POST /api/auth/sign-out

본문 없이 호출하면 세션 쿠키를 지웁니다.

## POST /api/identify

`multipart/form-data`로 JPG 또는 PNG `image` 파일 하나를 보냅니다. 최대 크기는 6MB입니다.

선택한 식물 부위는 `organ` 필드로 함께 보낼 수 있습니다. 허용값은 `flower`, `leaf`, `fruit`이며, `auto`이거나 필드를 생략하면 Pl@ntNet 자동 판별을 사용합니다.

처리 순서는 다음과 같습니다.

`사진 → Pl@ntNet 후보 3개 → 학명 → 공식 50종 확인 → 산림청 한국 이름·설명`

공식 목록과 학명이 정확히 일치하면 `plantId`, `stage`, `rarity`가 들어갑니다. 일치하지 않으면 각각 `null`이며 기타 식물로 처리합니다.

## POST /api/observations

로그인과 `multipart/form-data`가 필요합니다.

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

## PATCH /api/profile

닉네임과 프로필 사진을 바꿉니다. 별도 엔드포인트를 만들지 않고 프로필 하나로 처리합니다.

`multipart/form-data`로 보내며 **둘 다 선택 항목**입니다. 보낸 것만 반영하고, 아무것도 안 보내면 400입니다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `nickname` | X | 위 닉네임 규칙과 동일 |
| `avatar` | X | 6MB 이하 JPG 또는 PNG |

```ts
import { updateProfile } from '@/lib/api'

await updateProfile({ nickname: '초록탐험가' })
await updateProfile({ avatar: file })
await updateProfile({ nickname: '초록탐험가', avatar: file })
```

```json
{
  "success": true,
  "data": {
    "profile": {
      "nickname": "초록탐험가",
      "avatarUrl": "https://<프로젝트>.supabase.co/storage/v1/object/public/avatars/<userId>/<uuid>.jpg"
    }
  }
}
```

프로필 사진 파일은 전용 `avatars` 버킷에 `{userId}/{uuid}.jpg` 형태로 저장하고, `profiles.avatar_path` 열에는 그 경로만 넣습니다. 새 테이블은 없습니다. 사진을 바꾸면 이전 파일은 지워집니다.

기존 Supabase 프로젝트는 `supabase/profile-identity-migration.sql`을 한 번 실행하세요. 이미 중복된 닉네임이 있으면 먼저 만들어진 계정이 이름을 지키고, 나중 계정에만 id 앞 8자리가 붙습니다.

## DELETE /api/profile/avatar

프로필 사진을 지우고 기본 사진으로 되돌립니다. 본문은 없습니다.

사진만 지우는 요청이라 계정 삭제로 읽히지 않게 `/api/profile` 아래에 두었습니다.

```ts
import { deleteAvatar } from '@/lib/api'

await deleteAvatar()
```

```json
{
  "success": true,
  "data": { "profile": { "nickname": "초록탐험가", "avatarUrl": null } }
}
```

응답은 `PATCH /api/profile`과 같은 형태이고 `avatarUrl`은 항상 `null`입니다. 이미 기본 사진인 상태에서 호출해도 성공합니다. 두 번 눌러도 결과가 같아야 하기 때문입니다.

`profiles.avatar_path`를 먼저 비우고 나서 `avatars` 버킷의 파일을 지웁니다. 순서를 뒤집으면 열 갱신이 실패했을 때 없는 파일을 가리키게 됩니다.

## 조회 API

- `GET /api/collection`: 공식 50종의 수집 여부와 식물별 발견 횟수, 기타 발견 목록 (인증 필요)
- `GET /api/plants/:id`: 로컬 공식 목록과 산림청 설명, 해당 사용자의 관찰 기록 (인증 필요)
- `GET /api/profile`: 닉네임, 프로필 사진 주소, 누적 XP, 레벨, 현재 레벨 XP, 다음 레벨 요구 XP, 수집 통계 (인증 필요)
- `GET /api/activities`: 최근 활동 기록. `?limit=`으로 개수를 정하며 기본 3, 최대 20 (인증 필요)
- `DELETE /api/profile/avatar`: 프로필 사진을 지우고 기본 사진으로 되돌림 (인증 필요)
- `GET /api/health`: 환경변수 설정 여부 확인. 외부 API 요청은 보내지 않음
- `GET /api/openapi`: OpenAPI 3.0.3 문서. 정의는 `lib/openapi.ts`에 있습니다
