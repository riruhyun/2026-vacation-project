# 초록도감 프론트엔드 API 연동 설명서

프론트엔드에서 필요한 데이터의 필드와 API 연동 방법을 정의한다.
응답 예시는 대부분 로컬 서버의 실제 응답을 사용하며, 임의로 작성한 예시는 별도로 명시한다.

## 1. 필드별 API 위치

| 필요 데이터 | 필드 | 제공 API |
| --- | --- | --- |
| 한국 이름 | `koreanName` | identify · collection · plants/:id |
| 학명 (표시용, 저자 포함) | `scientificNameWithAuthor` | identify |
| 학명 (매칭 키, 저자 없음) | `scientificName` | 전부 |
| 식물 설명 | `description` | identify(공식 종만) · plants/:id |
| 과(科) 이름 | `family` | identify |
| 정확도 | `score` (0~1 소수) | identify |
| 후보 참고 사진 | `imageUrl` + `imageAttribution` | identify |
| 사용자 촬영 사진 | `representativeImageUrl` / `observations[].imageUrl` | collection · plants/:id |
| 희귀도 | `rarity` (`common`/`uncommon`/`rare`) | 전부 |
| 단계 | `stage` (1/2/3) | 전부 |
| 공식 50종인지 | `official`, `plantId` | identify |
| 수집 여부·발견 횟수 | `collected`, `observationCount` | collection · plants/:id |
| 경험치·레벨 | `reward` / `profile` | observations · profile |

**설명(`description`)은 공식 50종에만 제공된다.** 그 외에는 항상 `null`이며, 세부 기준은 3장에서 설명한다.

## 2. 공통 규칙

### 응답 포장

모든 응답은 아래 두 형식 중 하나이며, `lib/server/http.ts`에서 생성한다.

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "message": "오류 내용", "details": "선택" } }
```

### 화면 코드의 응답 범위

`lib/api.ts`의 함수는 공통 응답에서 `data`만 반환하며, 실패 시 `ApiError`를 발생시킨다.
따라서 화면 코드에서 `success`를 직접 검사할 필요가 없다.

```ts
import { identifyPlant, ApiError } from '@/lib/api'

try {
  const { candidates } = await identifyPlant(file) // data 객체의 내부 값
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isNotIdentified) return showRetryGuide() // 422
    if (error.isUnauthorized) return goLogin()          // 401
    showToast(error.message) // 사용자 표시용 서버 메시지
  }
}
```

`ApiError.status`는 HTTP 상태 코드이며, 네트워크 연결 자체가 실패하면 `0`이다.
`ApiError.details`에는 서버 내부 오류가 포함될 수 있으므로 화면에는 `message`만 표시한다.

### 사용자 구분

Supabase Auth 세션 쿠키를 사용한다. `/api/auth/sign-in` 또는 `/api/auth/sign-up`이 성공하면 쿠키가 설정되고, 이후 요청에는 브라우저가 자동으로 함께 보낸다. 화면에서 헤더를 붙일 일은 없다.

서버는 `lib/server/user.ts`의 `userIdFromSession()`으로 세션에서 사용자 UUID를 꺼낸다. 세션이 없으면 401이다.

| API | 로그인 |
| --- | --- |
| `POST /api/identify` | 필요 없음 |
| `GET /api/health` | 필요 없음 |
| `POST /api/auth/sign-up` · `sign-in` | 필요 없음 |
| `GET /api/plants/:id` | 선택 — 없으면 `userCollection`이 빈 상태로 반환됨 |
| `POST /api/observations` | **필수** (없으면 401) |
| `GET /api/collection` | **필수** (없으면 401) |
| `GET /api/profile` · `PATCH /api/profile` | **필수** (없으면 401) |
| `GET /api/activities` | **필수** (없으면 401) |

### 회원가입

닉네임, 이메일, 비밀번호를 **한 요청에 함께** 보낸다. 화면에서 세 칸을 다 채운 뒤 한 번만 호출한다.

```ts
await fetch('/api/auth/sign-up', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ nickname, email, password }),
})
```

닉네임은 2~16자이고 **대소문자를 무시하고 중복될 수 없다.** 사칭을 막기 위해서이며, 중복이면 409와 함께 `이미 사용 중인 닉네임이에요.`를 돌려준다. 앞뒤 공백은 제거되고 사이의 연속 공백은 하나로 줄어든다. 규칙은 `lib/nickname.ts`에 있다.

### 이미지 제약

`POST /api/identify`와 `POST /api/observations`는 JPG 또는 PNG 형식의 **6MB 이하** 이미지만 허용한다.
조건을 충족하지 않으면 400 상태와 함께 `"JPG 또는 PNG 이미지만 가능합니다."` 또는 `"이미지는 6MB 이하여야 합니다."`를 반환한다.

### 외부 이미지 표시

`next/image`로 외부 이미지를 표시하려면 해당 호스트가 `next.config.ts`의 `remotePatterns`에 등록되어야 한다. 현재 허용된 호스트는 다음과 같다.

- `bs.plantnet.org` — 후보 참고 사진
- Supabase Storage — 사용자 촬영 사진 (`NEXT_PUBLIC_SUPABASE_URL`에서 호스트를 읽으므로 빌드 시점에 해당 값 필요)

## 3. 값의 출처와 이름·설명이 정해지는 순서

| 값 | 출처 |
| --- | --- |
| 후보 학명, 정확도, 과, 참고 사진 | Pl@ntNet |
| 한국 이름, 설명 | 산림청 국립수목원 API (`lib/server/forest.ts`) |
| 공식 50종 목록, id, 단계, 희귀도 | `data/plants.ts` (코드 상수, DB 미사용) |
| 관찰 기록, 사진, XP, 레벨, 발견 횟수 | Supabase |

**공식 여부는 학명의 완전 일치로 판정한다.** Pl@ntNet의 `scientificNameWithoutAuthor`와 `data/plants.ts`의 학명이 대소문자를 제외하고 일치해야 한다. 따라서 `matchType`은 `"exact"` 또는 `null`이다.

`koreanName`이 정해지는 순서 (`app/api/identify/route.ts`):

1. 산림청 이름 — **공식 50종으로 판정된 후보만 조회**
2. `data/plants.ts`의 이름
3. Pl@ntNet 영어 상용명 (`commonNames[0]`)
4. 학명 원문

`description`은 산림청 상세정보의 형태(`shpe`)를 사용하며, 해당 값이 없으면 생육 특성(`spft`)을 사용한다. 공식 후보가 아니면 산림청을 조회하지 않으므로 **비공식 후보의 `description`은 항상 `null`이며 `koreanName`에는 영어 이름 또는 학명이 들어간다.**

## 4. 엔드포인트

### POST /api/identify

사진 한 장을 전송하면 최대 3개의 후보를 반환한다. 로그인은 필요하지 않다.

**요청** — `multipart/form-data`

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `image` | O | JPG 또는 PNG, 6MB 이하 |
| `organ` | 선택 | `auto`, `flower`, `leaf`, `fruit`. 생략 시 `auto` |

**실제 응답** (민들레 사진, 공식 종과 학명이 어긋난 경우)

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "plantId": null,
        "official": false,
        "matchType": null,
        "koreanName": "Common dandelion",
        "description": null,
        "scientificName": "Taraxacum sect. Taraxacum",
        "scientificNameWithAuthor": "Taraxacum sect. Taraxacum F.H.Wigg.",
        "family": "Asteraceae",
        "score": 0.29792,
        "stage": null,
        "rarity": null,
        "imageUrl": "https://bs.plantnet.org/image/m/70bbc8bb...",
        "imageAttribution": "Dumitru Stoica / Pl@ntNet, cc-by-sa"
      }
    ],
    "remainingRequests": 499
  }
}
```

공식 종으로 판정되면 동일한 위치에 다음 값이 포함된다. 아래 내용은 응답 구조 예시이다. `koreanName`, `description`, `stage`, `rarity`는 실제 `/api/plants/1` 응답을 기준으로 하며, `score`와 이미지 필드는 예시 값이다.

```json
{
  "plantId": 1,
  "official": true,
  "matchType": "exact",
  "koreanName": "질경이",
  "description": "원줄기는 없고 많은 잎이 뿌리에서 나와 옆으로 비스듬히 퍼진다. …",
  "scientificName": "Plantago asiatica",
  "scientificNameWithAuthor": "Plantago asiatica L.",
  "family": "Plantaginaceae",
  "score": 0.71,
  "stage": 1,
  "rarity": "common",
  "imageUrl": "https://bs.plantnet.org/image/m/…",
  "imageAttribution": "… / Pl@ntNet, cc-by-sa"
}
```

**`candidates[]` 필드**

| 필드 | 타입 | 의미 | 언제 비나 |
| --- | --- | --- | --- |
| `plantId` | `number \| null` | 공식 50종 id (1~50) | 비공식이면 `null` |
| `official` | `boolean` | 공식 50종 여부 | — |
| `matchType` | `"exact" \| null` | 학명 완전 일치 여부 | 비공식이면 `null` |
| `koreanName` | `string` | 표시용 이름. 비공식이면 영어명 또는 학명 | 절대 비지 않음 |
| `description` | `string \| null` | 산림청 설명 | **비공식이면 항상 `null`**, 공식이라도 산림청 조회 실패 시 `null` |
| `scientificName` | `string` | 저자 없는 학명. 저장·매칭 기준값 | — |
| `scientificNameWithAuthor` | `string` | 저자 포함 학명. 화면 표기용 | — |
| `family` | `string \| null` | 과 이름 (라틴어) | Pl@ntNet이 안 주면 `null` |
| `score` | `number` | 정확도 **0~1 소수**. % 표시는 곱하기 100 | — |
| `stage` | `1 \| 2 \| 3 \| null` | 난이도 단계 | 비공식이면 `null` |
| `rarity` | `"common" \| "uncommon" \| "rare" \| null` | 희귀도 | 비공식이면 `null` |
| `imageUrl` | `string \| null` | Pl@ntNet 참고 사진 (m → o → s 순으로 고름) | 사진이 없으면 `null` |
| `imageAttribution` | `string \| null` | 저작자·라이선스. **사진과 함께 표시 필요** | 없으면 `null` |
| `remainingRequests` | `number \| null` | Pl@ntNet 일일 잔여 호출 수 | 응답에 없으면 `null` |

후보는 정확도 내림차순으로 최대 3개를 반환한다.

후보 카드의 정확도 표시는 `components/identify/CandidatesScreen.tsx`에서 `score`에 100을 곱해 백분율로 변환한다.

**오류**

| 상태 | 상황 |
| --- | --- |
| 400 | `image` 누락, 형식 위반, `multipart/form-data`가 아님 |
| 422 | 사진에서 식물을 찾지 못함 → 재촬영 안내 (`ApiError.isNotIdentified`) |
| 500 | `PLANTNET_API_KEY` 미설정, 또는 Pl@ntNet에 연결 자체가 실패 |
| 502 | Pl@ntNet이 오류 응답을 준 경우 |

Pl@ntNet 호출에는 타임아웃이 없다. 외부 응답이 지연되면 API 요청도 계속 대기하므로 화면에 별도의 타임아웃 또는 취소 수단이 필요하다. 자세한 내용은 7장을 참고한다.

### POST /api/observations

사용자가 선택한 식물을 사진과 함께 저장하고 경험치를 계산한다. 성공 상태는 **201**이다.

**요청** — `multipart/form-data` (로그인 필요)

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `image` | O | JPG 또는 PNG, 6MB 이하 |
| `plantId` | 조건부 | 공식 식물 ID. 값이 있으면 서버가 이름과 학명을 설정 |
| `scientificName` | 조건부 | `plantId`가 없을 때 필요 |
| `displayName` | 조건부 | `plantId`가 없고 비공식일 때 필요 |

동작 규칙:

- `plantId`가 있으면 해당 공식 식물로 저장한다. 존재하지 않는 ID는 404를 반환한다.
- `plantId` 없이 `scientificName`만 전송해도 학명이 공식 50종에 해당하면 공식 식물로 처리하고 XP를 지급한다.
- 공식 식물의 `displayName`은 무시하며 `data/plants.ts`의 한국 이름을 저장한다.
- 둘 다 없으면 400.

**응답** — 아래 내용은 코드 기준의 응답 구조 예시이다. 저장 API 호출은 데이터와 XP를 변경하므로 문서 작성을 위한 별도 호출은 수행하지 않았다.

```json
{
  "success": true,
  "data": {
    "result": "duplicate",
    "observation": {
      "id": "00000000-0000-4000-8000-000000000000",
      "plantId": 8,
      "scientificName": "Commelina communis",
      "displayName": "닭의장풀",
      "imagePath": "<사용자 UUID>/<파일 UUID>.jpg",
      "imageUrl": "https://….supabase.co/storage/v1/object/public/observations/<사용자 UUID>/<파일 UUID>.jpg",
      "observedAt": "2026-08-10T17:23:41.856582+00:00"
    },
    "reward": {
      "xp": 125,
      "breakdown": [
        { "type": "observation", "label": "관찰", "xp": 10 },
        { "type": "first_discovery", "label": "첫 발견", "xp": 90 },
        { "type": "rarity_uncommon", "label": "보통 희귀도", "xp": 25 }
      ],
      "totalXp": 345,
      "level": 3,
      "currentLevelXp": 95,
      "xpToNextLevel": 200,
      "leveledUp": true,
      "plantCount": 1
    }
  }
}
```

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `result` | `"new" \| "duplicate"` | 첫 발견이면 `new`. 판정 기준은 `plantCount === 1` |
| `observation.id` | `string` | 관찰 기록 UUID |
| `observation.plantId` | `number \| null` | 공식 식물 id, 기타 식물은 `null` |
| `observation.displayName` | `string` | 저장된 표시 이름 |
| `observation.imagePath` | `string` | Storage 내부 경로. 화면 표시에는 사용하지 않음 |
| `observation.imageUrl` | `string` | 바로 `<Image src>`에 넣을 수 있는 공개 URL |
| `observation.observedAt` | `string` | ISO 8601 |
| `reward.xp` | `number` | 이번에 받은 XP. `breakdown`의 합과 항상 같다 |
| `reward.breakdown` | `XpEvent[]` | 지급 사유별 내역. `{ type, label, xp }`를 그대로 한 줄씩 렌더링하면 된다 |
| `reward.totalXp` | `number` | 누적 XP |
| `reward.level` | `number` | 갱신된 레벨 |
| `reward.currentLevelXp` | `number` | 현재 레벨 구간에서 모은 XP |
| `reward.xpToNextLevel` | `number` | 다음 레벨까지 필요한 총량. 진행바는 `currentLevelXp / xpToNextLevel` |
| `reward.leveledUp` | `boolean` | 이번 저장으로 레벨이 올랐는지 → 축하 연출 트리거 |
| `reward.plantCount` | `number` | 이 식물을 지금까지 몇 번 발견했는지 |

`breakdown`은 카드 획득 화면에 그대로 나열하기 위한 것이다. `xp`가 0인 항목(흔함 희귀도 등)은 화면에서 걸러도 된다.

```
관찰 +10 XP
첫 발견 +90 XP
보통 희귀도 +25 XP
+125 XP

Lv.3  95 / 200 XP
```

XP는 서버가 계산하고, Supabase 함수 `record_collection_observation_reward`가 발견 횟수, 누적 XP, 레벨, 관찰 기록을 하나의 트랜잭션에서 갱신한다. 저장 실패 시 업로드한 사진을 삭제한다.

**오류**: 400(입력) · 401(사용자 헤더 없음) · 404(없는 `plantId`) · 500(업로드/DB 실패)

### GET /api/collection

공식 50종 전체와 기타 발견 목록을 반환한다. 로그인이 필요하다.

**실제 응답** (일부)

```json
{
  "success": true,
  "data": {
    "summary": { "total": 50, "collected": 2, "completionRate": 4 },
    "plants": [
      {
        "id": 1,
        "koreanName": "질경이",
        "scientificName": "Plantago asiatica",
        "stage": 1,
        "rarity": "common",
        "collected": true,
        "observationCount": 1,
        "representativeImageUrl": "https://….supabase.co/storage/v1/object/public/observations/…"
      },
      {
        "id": 2,
        "koreanName": "괭이밥",
        "scientificName": "Oxalis corniculata",
        "stage": 1,
        "rarity": "common",
        "collected": false,
        "observationCount": 0,
        "representativeImageUrl": null
      }
    ],
    "others": []
  }
}
```

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `summary.total` | `number` | 항상 50 |
| `summary.collected` | `number` | 한 번이라도 발견한 공식 종 수 |
| `summary.completionRate` | `number` | 0~100 정수 (반올림) |
| `plants` | 배열 | **수집 여부와 무관하게 항상 50개 전체를 반환.** ID 1→50 순서이며 단계 1→3 순서와 동일 |
| `plants[].collected` | `boolean` | 잠금/해제 카드 분기용 |
| `plants[].observationCount` | `number` | 이 식물 발견 횟수 |
| `plants[].representativeImageUrl` | `string \| null` | 사용자가 가장 최근에 촬영한 사진. 미수집이면 `null` |
| `others[]` | 배열 | 공식 50종이 아닌 발견 기록 |

`others[]` 항목은 `scientificName`, `displayName`, `observationCount`, `representativeImageUrl`, `lastObservedAt`을 포함한다.
**주의: `others`의 빈 값은 `null`이 아닌 빈 문자열 `""`이다.** `plants`와 빈 값 처리 규칙이 다르다.

`plants[].koreanName`은 산림청 응답이 아니라 `data/plants.ts`의 이름을 사용한다. 관련 주의사항은 7장에서 설명한다.

**오류**: 401 · 500

### GET /api/plants/:id

식물 상세정보와 사용자 관찰 기록을 반환한다. 로그인은 선택 사항이다.

**실제 응답** (`/api/plants/1`, 사용자 헤더 있음)

```json
{
  "success": true,
  "data": {
    "plant": {
      "id": 1,
      "official": true,
      "koreanName": "질경이",
      "scientificName": "Plantago asiatica",
      "stage": 1,
      "rarity": "common",
      "description": "원줄기는 없고 많은 잎이 뿌리에서 나와 옆으로 비스듬히 퍼진다. 근경은 짧고 수염뿌리와 뿌리잎이 뭉쳐난다. 꽃대 높이는 10~50㎝ 정도 자란다. …",
      "informationSource": "산림청 국립수목원",
      "informationSourceUrl": "https://www.data.go.kr/data/15143513/openapi.do"
    },
    "userCollection": {
      "collected": true,
      "observationCount": 1,
      "observations": [
        {
          "id": "7e007ba2-12d6-4054-bd5c-ba6c0e19bed4",
          "imageUrl": "https://….supabase.co/storage/v1/object/public/observations/…",
          "observedAt": "2026-08-10T17:23:41.856582+00:00"
        }
      ]
    }
  }
}
```

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `plant.koreanName` | `string` | **산림청 이름 우선.** 없으면 공식 목록 이름 사용 |
| `plant.description` | `string \| null` | 산림청 설명. 카드 표시 시 길이 제한 처리 필요 |
| `plant.informationSource` | `string` | 화면에 표시할 출처 문구 |
| `plant.informationSourceUrl` | `string` | 출처 링크 |
| `userCollection.collected` | `boolean` | 사용자 헤더가 없으면 `false` |
| `userCollection.observations[]` | 배열 | 최신순. 사용자 헤더가 없으면 빈 배열 |

이 API는 공식 50종만 처리하므로 `official`은 항상 `true`이다.

**오류**: 400(id가 숫자가 아님) · 404(1~50 밖) · 500(DB 또는 **산림청 API 실패**, 7장 참고)

### GET /api/profile

닉네임, 프로필 사진 주소, 경험치, 관찰 통계를 반환한다. 로그인이 필요하다.

**실제 응답**

```json
{
  "success": true,
  "data": {
    "profile": {
      "nickname": "초록탐험가",
      "avatarUrl": null,
      "xp": 210,
      "level": 2,
      "currentLevelXp": 110,
      "xpToNextLevel": 150
    },
    "stats": {
      "totalObservations": 3,
      "officialPlants": 2,
      "otherPlants": 0,
      "completionRate": 4,
      "lastObservedAt": "2026-08-10T17:23:41.856582+00:00"
    }
  }
}
```

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `profile.nickname` | `string \| null` | 프로필 행이 없으면 `null` → 화면에서 기본값 처리 |
| `profile.avatarUrl` | `string \| null` | 프로필 사진 주소. 설정 전이면 `null` → 기본 아이콘 표시 |
| `profile.xp` | `number` | 누적 XP |
| `profile.level` | `number` | 현재 레벨 |
| `profile.currentLevelXp` | `number` | 이번 레벨에서 모은 XP |
| `profile.xpToNextLevel` | `number` | 다음 레벨까지 **필요한 총량**. 진행바는 `currentLevelXp / xpToNextLevel` |
| `stats.totalObservations` | `number` | 전체 관찰 횟수 (중복 포함) |
| `stats.officialPlants` | `number` | 발견한 공식 종 수 |
| `stats.otherPlants` | `number` | 발견한 기타 종 수 |
| `stats.completionRate` | `number` | 0~100 정수 |
| `stats.lastObservedAt` | `string \| null` | 마지막 관찰 시각. 기록이 없으면 `null` |

위 예시는 질경이(흔함) 첫 발견, 닭의장풀(흔함) 첫 발견, 닭의장풀 재관찰 보상을 합산한 `100 + 100 + 10 = 210`이다.

**오류**: 401 · 500

### PATCH /api/profile

닉네임과 프로필 사진을 바꾼다. 별도 엔드포인트를 만들지 않고 프로필 하나로 처리한다.

**요청** — `multipart/form-data` (로그인 필요). **두 필드 모두 선택**이며 보낸 것만 반영된다. 아무것도 안 보내면 400이다.

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `nickname` | X | 2~16자. 중복 불가 |
| `avatar` | X | JPG 또는 PNG, 6MB 이하 |

```ts
import { updateProfile } from '@/lib/api'

await updateProfile({ nickname: '초록탐험가' })
await updateProfile({ avatar: file })
await updateProfile({ nickname: '초록탐험가', avatar: file })
```

**응답 구조 예시**

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

프로필 사진은 전용 `avatars` 버킷에 `{userId}/{uuid}.jpg` 형태로 저장된다. 사진을 바꾸면 이전 파일은 삭제된다.

**오류**: 400(변경할 내용 없음·형식 위반) · 401 · 404(프로필 없음) · **409(닉네임 중복)** · 500

### GET /api/activities

최근 활동 기록을 최신순으로 반환한다. 로그인이 필요하다.

**요청** — 쿼리 `limit`. 1~20 사이 정수이며 기본값과 잘못된 값의 대체값은 모두 3이다.

**응답 구조 예시**

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "0f0c…",
        "type": "new_plant",
        "collectionCardId": 1,
        "scientificName": "Plantago asiatica",
        "displayName": "질경이",
        "level": null,
        "createdAt": "2026-08-16T10:02:11.000Z"
      }
    ]
  }
}
```

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `type` | `"new_plant" \| "level_up"` | 활동 종류 |
| `collectionCardId` | `number \| null` | `new_plant`이고 공식 종일 때만 값이 있음 |
| `scientificName` · `displayName` | `string \| null` | `level_up`이면 `null` |
| `level` | `number \| null` | `level_up`일 때 달성 레벨. 그 외엔 `null` |

**오류**: 401 · 500

### GET /api/health

환경변수 설정 여부만 확인한다. 외부 API를 호출하지 않으므로 할당량을 사용하지 않는다.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "checkedAt": "2026-08-12T13:10:44.844Z",
    "services": { "supabase": true, "plantNet": true, "forest": true }
  }
}
```

## 5. 열거형과 계산 규칙

### 단계와 희귀도

단계와 희귀도는 1:1로 대응한다.

| `stage` | `rarity` | 한글 표기 | 희귀도 보너스 | 첫 발견 합계 XP |
| ---: | --- | --- | ---: | ---: |
| 1 | `common` | 흔함 | +0 | 100 |
| 2 | `uncommon` | 보통 | +25 | 125 |
| 3 | `rare` | 드묾 | +50 | 150 |

화면 표기에는 직접 정의한 매핑 대신 `types/domain.ts`의 상수를 사용한다.

```ts
import { RARITY_LABEL } from '@/types/domain'
RARITY_LABEL[plant.rarity] // "흔함" | "보통" | "드묾"
```

### 경험치 구성

기본 경험치에 조건별 보너스를 더한다. 규칙은 전부 `lib/progress.ts`에 있다.

| 조건 | XP |
| --- | ---: |
| 유효한 관찰 | +10 |
| 처음 발견한 종 | +90 |
| 희귀도 보너스 (흔함 / 보통 / 드묾) | +0 / +25 / +50 |

첫 발견 보너스와 희귀도 보너스는 도감 카드를 처음 등록할 때만 한 번 지급한다. 따라서:

- 이미 모은 식물 재관찰: `10 XP`
- 같은 날 같은 종 추가 촬영: `0 XP` (기준은 한국 시간 자정)
- 도감 밖 기타 식물: `10 XP`, 첫 발견·희귀도 보너스 없음

새로운 흔한 종 1개(100 XP)가 재관찰 10회와 같은 가치가 되도록 잡은 값이다.

### 레벨

레벨 1→2에는 100 XP가 필요하며, 이후 요구량은 레벨마다 50 XP씩 증가한다. `100 → 150 → 200 → 250 …` (`lib/progress.ts`)

- `Lv.N → Lv.N+1 필요 XP = 100 + 50 × (N - 1)`
- `Lv.N 도달 누적 XP = 100(N-1) + 25(N-1)(N-2)` → Lv.10은 누적 2,700 XP

저장되는 값은 누적 XP 하나뿐이고 레벨과 구간 진행도는 거기서 파생한다. 누적 380 XP는 `Lv.3 · 130 / 200 XP`로 표시된다.

## 6. 화면별로 쓰는 필드

**촬영 / 식별 결과**

`identifyPlant(file)`의 `candidates[]`를 후보 카드 목록으로 표시한다. 카드에는 `koreanName`, `score`(×100), `imageUrl`, `imageAttribution`을 사용한다.
`official`이 `true`이면 `rarity` 배지와 `description`을 함께 표시할 수 있다.
사용자가 카드를 선택하면 `saveObservation({ image, plantId, scientificName, displayName })`에 선택 정보를 전달한다.

**도감 목록**

`getCollection()`의 `summary`를 상단 진행도에 사용하고, `plants[]`의 50개 항목을 그리드로 표시한다.
`collected` 값으로 잠금 상태를 구분한다. `representativeImageUrl`이 있으면 사용자 사진을, 없으면 기본 이미지를 사용한다.

**식물 상세**

`getPlant(id)`의 `plant.koreanName`, `plant.scientificName`, `plant.description`, 출처 정보를 표시한다.
`userCollection.observations[]`는 최신순 사진 목록으로 표시한다.

**프로필**

`getProfile()`의 진행률은 `currentLevelXp / xpToNextLevel`로 계산하며, 통계에는 `stats`를 사용한다.

## 7. 오류 처리 현황과 주의사항

### 지금 처리되고 있는 것

| 라우트 | 처리하는 상황 |
| --- | --- |
| `POST /api/identify` | 폼 파싱 실패·이미지 누락·형식·용량 400 / 키 없음 500 / 식별 실패 422 / Pl@ntNet 오류 502. 산림청 조회 실패는 `.catch(() => null)`로 삼키고 `description`만 `null` |
| `POST /api/observations` | 사용자 헤더 없음 401 / 입력 400 / 없는 `plantId` 404. **DB 저장 실패 시 업로드한 사진 삭제** |
| `GET /api/collection` · `GET /api/profile` | 401 + 전체 try/catch 500 |
| `GET /api/plants/:id` | id가 숫자가 아니면 400 / 1~50 밖이면 404 |
| `GET /api/health` | 외부 API를 호출하지 않음. Supabase 모듈과 독립적으로 응답 |
| `lib/api.ts` (화면) | 네트워크 자체 실패는 `ApiError.status === 0`, JSON이 아닌 응답도 잡아 `ApiError`로 통일 |

401, 404, 400 상태는 로컬 호출로 확인했으며, 나머지는 코드 동작을 기준으로 작성했다.

### 알려진 제한 사항

다음 제한 사항은 아직 해결되지 않았으며 화면 구현 시 고려가 필요하다.

1. **`/api/plants/:id`는 산림청 API 실패 시 전체 요청에 500을 반환한다.** `getForestPlant` 호출이 별도로 처리되지 않으므로 산림청 장애 또는 `FOREST_API_KEY` 누락 시 식물 상세정보를 조회할 수 없다. `/api/identify`는 같은 상황에서 `description: null`을 반환한다. 상세 화면에 재시도 기능이 필요하다.
2. **Pl@ntNet 호출에는 타임아웃이 없다.** 산림청 호출에는 `AbortSignal.timeout(10000)`이 적용되어 있으나 `app/api/identify/route.ts`의 `fetch`에는 타임아웃이 없다. 외부 응답이 지연되면 화면이 계속 로딩될 수 있으므로 자체 타임아웃 또는 취소 기능이 필요하다. 네트워크 연결 실패는 502가 아닌 500으로 반환된다.
3. **500 응답의 `error.details`에 내부 오류가 포함된다.** Supabase 오류가 브라우저까지 전달될 수 있으므로 사용자 화면에는 `error.message`만 표시하고 `details`는 노출하지 않는다.
4. **프로필 사진 버킷도 공개이다.** `avatars` 버킷은 관찰 사진 버킷과 마찬가지로 공개 설정이라 URL을 아는 사람은 누구나 볼 수 있다. 비공개가 필요하면 6번과 함께 서명 URL로 전환해야 한다.

### 데이터와 표시 주의사항

1. **동일 식물의 한국 이름이 화면마다 다를 수 있다.** 목록(`/api/collection`)은 `data/plants.ts`의 이름을 사용하고, 상세(`/api/plants/:id`)는 산림청 이름을 우선한다. 예를 들어 ID 14는 목록에서 "민들레", 상세에서 "서양민들레"로 표시될 수 있다.
2. **비공식 후보의 이름은 한국어가 아닐 수 있다.** 학명이 `Taraxacum sect. Taraxacum`처럼 공식 목록과 일치하지 않으면 `koreanName`에 `"Common dandelion"` 같은 영어 이름이 포함된다. 공식 여부를 학명의 완전 일치로 판정하기 때문이다.
3. `others[]`의 빈 값은 `null`이 아닌 `""`이다.
4. `score`는 퍼센트가 아닌 0~1 범위의 소수이다.
5. 공식 목록은 DB가 아닌 `data/plants.ts`에 있다. 종을 추가하거나 수정하면 재배포가 필요하다. 관찰 기록은 학명을 기준으로 연결되므로 학명 변경 시 기존 기록과의 연결이 끊어진다.
6. Storage 사진 URL은 공개 링크이다. 비공개 저장소로 전환하려면 `lib/server/image.ts`에 서명 URL 방식을 적용해야 한다.

## 8. 타입 위치

응답 타입은 `types/`에서 관리한다. 화면에서 별도 타입을 중복 정의하지 않고 해당 타입을 가져와 사용한다.

| 타입 | 파일 |
| --- | --- |
| `ApiResponse<T>`, `HealthResponse` | `types/api.ts` |
| `IdentifyCandidateDto`, `IdentifyResponseDto` | `types/identify.ts` |
| `CollectionResponseDto`, `PlantDetailResponseDto` | `types/plant.ts` |
| `ObservationDto`, `CreateObservationResponseDto`, `CreateObservationInput` | `types/observation.ts` |
| `ProfileResponse` | `types/user.ts` |
| `RarityCode`, `PlantStage`, `RARITY_LABEL` | `types/domain.ts` |

## 9. 로컬에서 확인하기

`.env.local`에 `PLANTNET_API_KEY`, `FOREST_API_KEY`, Supabase 키를 채우고 `npm run dev` 후:

```bash
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/plants/1
curl -s -c 쿠키.txt -X POST http://localhost:3000/api/auth/sign-in \
  -H "content-type: application/json" \
  -d '{"email":"me@example.com","password":"비밀번호"}'
curl -s -b 쿠키.txt http://localhost:3000/api/collection
curl -s -b 쿠키.txt http://localhost:3000/api/profile
curl -s -X POST http://localhost:3000/api/identify -F "image=@사진.jpg;type=image/jpeg"
```

새 Supabase 프로젝트는 `supabase/schema.sql`을 실행한다. 기존 프로젝트는 SQL Editor에서 `supabase/progress-migration.sql`, `supabase/xp-rebalance-migration.sql`, `supabase/profile-identity-migration.sql`을 한 번씩 실행한다.
