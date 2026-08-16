# 초록도감 API

모든 응답은 아래 두 형식 중 하나입니다. 공통 형식은 `lib/server/http.ts` 한 곳에서 바꿀 수 있습니다.

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "message": "오류 내용" } }
```

## 데이터 구성

- 공식 도감 50종: Supabase `collection_cards` 테이블 (`supabase/collection-cards-migration.sql`)
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

사용자 구분은 Supabase 세션의 액세스 토큰을 씁니다. 클라이언트는 사용자별 API 요청에
`Authorization: Bearer <액세스 토큰>` 헤더를 붙여야 합니다. 서버 컴포넌트에서 조회할 때는
같은 토큰을 `plant-access-token` 쿠키에 저장할 수 있습니다 (`lib/server/current-user.ts`).

토큰이 없거나 만료됐으면 API는 401 `로그인이 필요합니다.`를 돌려줍니다. `ApiError.isUnauthorized`로 확인할 수 있습니다.

## POST /api/identify

`multipart/form-data`로 JPG 또는 PNG `image` 파일 하나를 보냅니다. 최대 크기는 6MB입니다.

보낼 값은 `image` 하나뿐입니다. 식물 부위는 Pl@ntNet이 스스로 판별합니다.

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

사용자별 API는 로그인이 필요합니다. 토큰 확인은 `lib/server/user.ts` 한 곳에서 합니다.

## PATCH /api/profile

닉네임과 대표 식물을 저장합니다. 보낸 항목만 바뀝니다.

```json
{ "nickname": "초록수집가", "featuredPlantIds": [1, 8, 14] }
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `nickname` | 선택 | 1자 이상 20자 이하 |
| `featuredPlantIds` | 선택 | 대표 식물 도감 id. 최대 3개, 중복 불가, 수집한 식물만 가능 |

한 번이라도 저장하면 `profile.onboarded`가 `true`가 되고, 그 뒤로는 온보딩 화면으로 보내지 않습니다.

## 인증

가입 방식은 두 가지입니다.

```
구글로 계속하기        →  가입이자 로그인. 실제 메일 주소를 씁니다
아이디 + 비밀번호       →  메일 주소를 쓰지 않는 가입
```

### 아이디는 메일 주소가 될 수 없습니다

아이디 회원가입은 **`@`가 들어간 값을 거부합니다.** 저장할 때는 예약 도메인을 붙입니다.

```
sooji_01  →  sooji_01@id.plantdex.invalid
```

`.invalid`는 RFC 2606이 예약한 최상위 도메인이라 누구도 등록할 수 없습니다. 즉 이 주소는 실제 메일 주소가 될 수 없고, 구글 계정의 주소와 **절대 같아지지 않습니다.**

이게 선점 공격을 막는 방식입니다. 일반 가입을 열어두면 남의 지메일 주소로 먼저 계정을 만들어 두었다가, 주인이 구글로 들어올 때 Supabase가 같은 이메일이라며 두 계정을 합쳐 버립니다. 그러면 선점한 사람이 자기가 정한 비밀번호로 남의 도감에 들어갑니다. 주소가 겹칠 수 없으면 합쳐질 일도 없습니다.

아이디 규칙은 영문 소문자, 숫자, 밑줄 3~20자입니다 (`lib/auth-api.ts`).

계정은 admin API로 `email_confirm: true`와 함께 만듭니다. 보낼 수 없는 주소이므로 **확인 메일을 시도조차 하지 않고**, 가입과 동시에 로그인됩니다. 인증 번호를 받을 일이 없습니다.

### 로그인 본문

`id`와 `email` 중 **하나만** 보냅니다.

```json
{ "id": "sooji_01", "password": "..." }        // 아이디로 가입한 계정
{ "email": "user@gmail.com", "password": "..." } // 구글 계정 + 사이트 전용 비밀번호
```

### 사이트 전용 비밀번호

`POST /api/auth/password`로 설정합니다. **로그인한 상태에서만** 부를 수 있습니다.

로그인 전에 만들 수 있게 하면, 남의 이메일 주소로 비밀번호를 선점해 두었다가 주인이 구글로 들어올 때 같은 계정으로 합쳐져 계정을 빼앗을 수 있습니다. Supabase는 이메일이 같으면 자동으로 계정을 합치기 때문입니다. "이미 본인임이 증명된 사람만 열쇠를 추가한다"는 규칙이 이를 막습니다.

설정 여부는 `public.profiles.has_site_password`에 기록합니다 (`supabase/site-password-migration.sql`). `auth.users`에는 비밀번호 설정 여부를 알려주는 필드가 없어서 우리가 직접 관리합니다.

### 로그인 실패 구분

`POST /api/auth/login`이 실패하면 `error.details.reason`으로 이유를 구분합니다. 화면은 문구가 아니라 이 값으로 분기하면 됩니다.

| reason | 상태 | 뜻과 안내 |
| --- | ---: | --- |
| `google_only` | 409 | 구글로만 가입한 계정입니다. 사이트 전용 비밀번호를 먼저 설정해야 합니다. **구글 로그인 버튼을 함께 띄우세요.** |
| `invalid_password` | 401 | 비밀번호가 틀렸습니다. 아이디 계정은 항상 이쪽입니다 |
| `not_registered` | 401 | 가입 이력이 없습니다 |
| `email_not_confirmed` | 403 | 이메일 확인이 필요합니다 |

아이디로 가입한 계정에는 **`google_only`를 띄우지 않습니다.** 처음부터 비밀번호가 있는 계정이라 구글 안내가 맞지 않습니다. 서버가 저장된 주소의 도메인을 보고 구분합니다.

`POST /api/auth/signup`은 이미 쓰는 아이디면 409 `id_taken`으로 막습니다.

### 알려진 제약

**비밀번호 분실 복구가 없습니다.** 구글 계정에 접근할 수 없고 사이트 전용 비밀번호도 설정하지 않은 사용자는 들어올 방법이 없습니다. 가입 시 예방을 권고하는 화면도 두지 않았습니다. 시연 범위 밖으로 의도적으로 둔 것이며, 필요해지면 Supabase의 비밀번호 재설정 메일을 붙이면 됩니다.

### 첫 화면은 로그아웃 상태입니다

기본 사용자는 없습니다. 토큰이 없으면 보호 API는 전부 401이고, 화면은 로그인 화면을 그려야 합니다.

다만 "로그인 안 함"을 확인하려고 401을 받아볼 필요는 없습니다. `GET /api/auth/session`은 로그아웃도 정상 응답으로 답합니다.

```json
{ "success": true, "data": { "authenticated": false, "user": null } }
```

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": { "id": "...", "account": "sooji_01", "isLocalId": true }
  }
}
```

만료된 토큰도 `authenticated: false`입니다. 화면은 이 값 하나만 보고 분기하면 되고, 401을 오류로 다룰 수 있게 됩니다.

### 엔드포인트

- `GET /api/auth/session`: 지금 로그인한 사용자를 알려줍니다. 로그아웃 상태여도 200입니다.
- `POST /api/auth/signup`: `id`, `password`, 선택적 `nickname`으로 가입하고 바로 로그인합니다. 이메일 주소는 거부합니다.
- `POST /api/auth/login`: `id` 또는 `email`과 `password`로 로그인하고 `plant-access-token` HttpOnly 쿠키를 설정합니다.
- `POST /api/auth/password`: 로그인한 사용자의 사이트 전용 비밀번호를 설정합니다.
- `POST /api/auth/logout`: 현재 세션을 폐기하고 로그인 쿠키를 제거합니다.

Swagger(`/api-docs`)에서는 `Auth`의 로그인 API를 한 번 실행한 뒤 보호 API를 실행하면 쿠키가 자동으로 함께 전송됩니다. 별도로 토큰을 복사할 필요가 없습니다. 외부 API 클라이언트는 로그인 응답의 `accessToken`을 `Authorization: Bearer <token>`으로 보낼 수도 있습니다.
