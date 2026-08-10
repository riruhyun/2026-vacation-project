# 초록도감 API

모든 응답은 아래 모양입니다. 응답 포장은 `lib/server/http.ts`에서 한 번에 바꿀 수 있습니다.

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "오류 내용" } }
```

## 화면에서 부르는 방법

직접 `fetch`를 쓰지 말고 `lib/api.ts`를 쓰면 됩니다. 응답 포장을 벗겨 `data`만 돌려주고, 실패하면 `ApiError`를 던집니다.

```ts
'use client'

import { identifyPlant, saveObservation, ApiError } from '@/lib/api'
import type { PlantCandidate } from '@/types/plant'

async function run(image: File) {
  try {
    const { candidates } = await identifyPlant(image)
    const picked: PlantCandidate = candidates[0]

    const { result } = await saveObservation({
      image,
      plantId: picked.plantId,
      scientificName: picked.scientificName,
      displayName: picked.koreanName,
    })

    if (result === 'new') {
      // 첫 발견 → 카드 공개 연출
    }
  } catch (error) {
    if (error instanceof ApiError && error.isNotIdentified) {
      // 사진에서 식물을 찾지 못함 → 다시 촬영 안내
    }
  }
}
```

로그인 연결 전에는 사용자 API에 `x-user-id` 헤더가 필요합니다. 앱 시작 지점에서 한 번 지정하면 됩니다.

```ts
import { setUserId } from '@/lib/api'

setUserId('00000000-0000-4000-8000-000000000001')
```

헤더를 보내지 않으면 `.env.local`의 `DEV_USER_ID`가 대신 쓰입니다. 둘 다 없으면 `401`입니다.
인증이 연결되면 `lib/server/user.ts`와 `lib/api.ts`의 `userHeaders` 두 곳만 고치면 됩니다.

## GET /api/health

서버가 응답하는지, 각 서비스 키가 설정됐는지 확인합니다. 외부 API 할당량을 쓰지 않습니다.

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "checkedAt": "2026-08-09T00:00:00.000Z",
    "services": { "supabase": true, "plantNet": true, "iNaturalist": true }
  }
}
```

## POST /api/identify

`multipart/form-data`

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| image | JPG 또는 PNG 파일 | O | 최대 6MB |

사진 판별은 Pl@ntNet, 공식 도감 확인은 Supabase를 사용합니다. `score`는 0부터 1 사이이며 `plantId`가 `null`이면 기타 식물입니다. 식물을 찾지 못하면 HTTP `422`를 반환합니다.

### 공식 도감 매칭 방식

Pl@ntNet은 종명 대신 절 이름(`Taraxacum sect. Taraxacum`)이나 동의어(`Taraxacum campylodes`)를 반환할 때가 있어, 학명 완전일치만으로는 도감에 붙지 않습니다. 그래서 두 단계로 찾습니다.

| `matchType` | 설명 |
| --- | --- |
| `exact` | 학명이 그대로 일치 |
| `genus` | 속이 같고, **그 속의 공식 식물이 하나뿐일 때만** 연결 |
| `null` | 공식 도감에 없음 (기타 발견) |

같은 속에 공식 식물이 둘 이상이면 어느 쪽인지 정할 수 없으므로 붙이지 않습니다. 임의로 고르면 사용자가 직접 선택한다는 원칙이 깨지기 때문입니다. **같은 속의 다른 종을 도감에 추가하면 그 속의 `genus` 폴백은 자동으로 꺼집니다.**

`genus`로 붙은 후보는 `koreanName`과 `rarity`가 도감 값으로 바뀌지만, `scientificName`은 Pl@ntNet이 준 값 그대로입니다. 화면에서 "속 기준 추정"으로 표시하고 싶다면 `matchType`을 쓰면 됩니다. 저장할 때는 `plantId`만 보내면 서버가 도감의 학명을 씁니다.

응답 타입은 `IdentifyResponse` (`types/plant.ts`)입니다.

## POST /api/observations

`x-user-id`가 필요합니다. `multipart/form-data`를 사용합니다.

| 필드 | 형식 | 필수 | 설명 |
| --- | --- | --- | --- |
| image | JPG 또는 PNG 파일 | O | 사용자 촬영 사진 |
| plantId | 숫자 | 조건부 | 공식 식물 ID |
| scientificName | 문자열 | 조건부 | 기타 식물일 때 필요 |
| displayName | 문자열 | 조건부 | 기타 식물일 때 필요 |

`result`는 첫 발견이면 `new`, 기존 발견이면 `duplicate`입니다. 성공 시 `201`입니다.
응답의 `observation`은 DB 컬럼명을 그대로 쓰기 때문에 이 객체만 snake_case입니다 (`CreateObservationResponse`, `types/observation.ts`).

## GET /api/collection

`x-user-id`가 필요합니다. 공식 도감의 획득 여부, 완성률, 기타 발견을 반환합니다. 목록에는 표시명과 매칭 키만 있고 상세 식물정보는 없습니다. 미획득 식물은 `representativeImageUrl`이 `null`이라 실루엣으로 표시하면 됩니다.

응답 타입은 `CollectionResponse` (`types/plant.ts`)입니다.

## GET /api/plants/:id

Supabase에서 공식 도감 여부를 확인하고 iNaturalist에서 한국어 이름, 대표 사진, 요약을 조회합니다. `x-user-id`가 있으면 그 사용자의 관찰 기록도 함께 반환합니다.

`plants` 테이블에는 분류에 필요한 `korean_name`, `scientific_name`, `rarity`만 저장하고, 상세 정보는 저장하지 않습니다. iNaturalist는 공개 조회라 키가 필요 없습니다.

응답 타입은 `PlantDetailResponse` (`types/plant.ts`)입니다.

## GET /api/profile

`x-user-id`가 필요합니다. 닉네임, 누적 경험치, 총 관찰 수, 공식·기타 발견 수, 완성률을 반환합니다.

**경험치 적립과 레벨 계산은 아직 없습니다.** `xp`는 읽기만 하며 관찰을 저장해도 자동으로 오르지 않습니다. 기획안 5.5의 규칙(신규 100 XP, 보통 +30, 드묾 +70, 재관찰 10, 같은 날 1회)은 게임 UI·데이터 담당이 연결해야 합니다.

응답 타입은 `ProfileResponse` (`types/user.ts`)입니다.

## 담당 경계

- 이 코드: 식별, iNaturalist 식물정보 조회, 이미지 업로드, 관찰 저장, 중복 판단, 도감·상세·통계 조회
- 별도 담당: 로그인, 경험치 적립과 레벨 계산, 모든 UI
