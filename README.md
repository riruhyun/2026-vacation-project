# 초록도감

일상에서 발견한 식물을 촬영하면 AI가 후보를 제시하고, 사용자가 고른 식물을 자기 사진으로 만든 카드와 도감에 수집하는 서비스입니다. 모바일 우선 반응형 웹입니다.

## 시작하기

1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행한 뒤 `supabase/seed.sql`을 실행합니다.
2. `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다. iNaturalist는 키가 필요 없습니다.
3. 설치하고 실행합니다.

```bash
npm install
npm run dev
```

4. http://localhost:3000/api/health 에서 키가 제대로 잡혔는지 확인합니다.

## 폴더 구조

```
app/
  api/          서버 API (Route Handler)
  <화면>/        페이지
lib/
  api.ts        화면에서 API를 부르는 함수 모음 (브라우저에서 사용)
  server/       서버 전용 모듈 (클라이언트 컴포넌트에서 import 금지)
types/          팀 공통 타입과 API 응답 형식
supabase/       DB 스키마와 공식 도감 시드
docs/api.md     API 사용법
```

`lib/server/supabase.ts`는 Supabase 비밀 키를 사용합니다. **클라이언트 컴포넌트에서 import하면 안 됩니다.** 화면에서는 항상 `lib/api.ts`를 거쳐 API를 호출합니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | ESLint |

## 아직 없는 것

- 로그인 (지금은 `x-user-id` 헤더 또는 `DEV_USER_ID`로 사용자를 구분합니다)
- 경험치 적립과 레벨 계산
- 공식 도감 데이터 (현재 3종, 기획안 목표는 30~50종)
