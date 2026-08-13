# Frontend Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프런트엔드가 하나의 비동기 데이터 접근 계층과 일관된 화면·스타일 규칙을 사용하도록 정리하고, 공식 50종 도감·기타 발견·식물 식별 흐름을 현재 백엔드 계약에 맞게 동작시킨다.

**Architecture:** `data/plants.ts`는 공식 50종의 정적 메타데이터만, `data/mock.ts`는 화면 시험용 응답 fixture만 보유한다. 모든 페이지는 async `lib/data.ts`를 통해 데이터를 받고 Screen 컴포넌트에 props로 전달한다. 식별 중에만 `sessionStorage`를 사용하고, 식별 결과는 `/identify`의 명시적 상태로 표현한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, `@remixicon/react`, Vitest

## Global constraints

- 백엔드 API·Supabase를 실제로 연결하지 않는다. 기존 API route와 공유 DTO의 모양만 프런트엔드와 일치시킨다.
- `localStorage`나 전역 상태 라이브러리를 추가하지 않는다.
- 공식 식물은 숫자 `id`, 비공식 발견은 URL 인코딩한 `scientificName`을 식별자로 쓴다.
- `category`, `season`, `observedSeason`, slug 기반 식별자는 제거한다. 촬영 시점은 ISO `observedAt`만 저장한다.
- 레이아웃·간격·타이포그래피·상태 표현은 Tailwind를 기본으로 한다. 색상·radius는 역할 기반 CSS variable을 Tailwind arbitrary value로 참조한다.
- 한 번만 쓰는 얇은 wrapper나 ViewModel은 만들지 않는다. 서로 다른 서버 응답을 한 화면에 전달하기 위해 정규화가 필요한 경우만 작은 화면 데이터 타입을 둔다.
- 각 작업의 삭제 단계 전에는 `rg`로 참조가 0건인지 확인한다.
- 아래 커밋 단위는 권장 단위다. 사용자가 커밋을 원하지 않으면 단계별 diff만 유지한다.

---

## Task 1: Vitest와 공식 50종 카탈로그 기준선 만들기

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `lib/data.test.ts`
- Create: `data/plants.ts`
- Modify: `app/api/collection/route.ts`
- Modify: `app/api/identify/route.ts`
- Modify: `app/api/observations/route.ts`
- Modify: `app/api/plants/[id]/route.ts`
- Modify: `app/api/profile/route.ts`
- Keep temporarily: `data/official-plants.ts`, `data/plant-species.ts`

- [ ] **Step 1: Vitest 의존성과 스크립트 추가**

`package.json`에 다음 스크립트와 개발 의존성을 추가한다.

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

`vitest.config.ts`는 `@` alias를 현재 `tsconfig.json`과 동일하게 해석한다.

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
```

Run: `npm install --save-dev vitest@^3.2.4`

- [ ] **Step 2: 공식 카탈로그 불변 조건을 먼저 테스트로 작성**

`lib/data.test.ts`를 프로젝트의 유일한 data-layer 테스트 파일로 만들고 첫 describe를 작성한다.

```ts
import { describe, expect, it } from "vitest";
import { OFFICIAL_PLANTS } from "@/data/plants";

describe("OFFICIAL_PLANTS", () => {
  it("contains exactly 50 plants with stable unique identifiers", () => {
    expect(OFFICIAL_PLANTS).toHaveLength(50);
    expect(new Set(OFFICIAL_PLANTS.map(({ id }) => id)).size).toBe(50);
    expect(
      new Set(OFFICIAL_PLANTS.map(({ scientificName }) => scientificName)).size,
    ).toBe(50);
  });

  it("is ordered by numeric id and uses only supported stages", () => {
    expect(OFFICIAL_PLANTS.map(({ id }) => id)).toEqual(
      [...OFFICIAL_PLANTS].sort((a, b) => a.id - b.id).map(({ id }) => id),
    );
    expect(OFFICIAL_PLANTS.every(({ stage }) => [1, 2, 3].includes(stage))).toBe(true);
  });
});
```

Run: `npm test -- lib/data.test.ts`
Expected: FAIL because `data/plants.ts` does not exist.

- [ ] **Step 3: 공식 식물 데이터 한 벌을 생성**

`data/official-plants.ts`의 50종을 기준으로 `data/plants.ts`를 만들고, 각 항목은 정확히 아래 필드만 갖게 한다.

```ts
import type { PlantStage, RarityCode } from "@/types/domain";

export interface OfficialPlant {
  id: number;
  stage: PlantStage;
  koreanName: string;
  scientificName: string;
  rarity: RarityCode;
}

export const OFFICIAL_PLANTS: readonly OfficialPlant[] = [
  // data/official-plants.ts의 plant(1, ...)부터 plant(50, ...)까지 값을 그대로 이관
];

const byId = new Map(OFFICIAL_PLANTS.map((item) => [item.id, item]));
const byScientificName = new Map(
  OFFICIAL_PLANTS.map((item) => [item.scientificName.toLowerCase(), item]),
);

export function getOfficialPlantById(id: number) {
  return byId.get(id) ?? null;
}

export function getOfficialPlant(scientificName: string) {
  return byScientificName.get(scientificName.trim().toLowerCase()) ?? null;
}
```

`data/plant-species.ts`에만 존재하는 표시명·학명 차이는 공식 API/현재 백엔드 데이터와 대조하고, 하나의 값으로 결정해 이 파일에 반영한다. 중복 데이터 파일은 아직 삭제하지 않아 기존 화면을 깨지 않게 한다.

- [ ] **Step 4: 식물 API route가 새 카탈로그를 읽게 변경**

`app/api/collection/route.ts`, `app/api/identify/route.ts`, `app/api/observations/route.ts`, `app/api/plants/[id]/route.ts`, `app/api/profile/route.ts`의 공식 목록 import를 모두 `@/data/plants`로 바꾼다. 기존 숫자 검증과 404 동작은 유지한다.

- [ ] **Step 5: 기준선 검증**

Run: `npm test -- lib/data.test.ts`
Expected: PASS, 2 tests.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json vitest.config.ts data/plants.ts lib/data.test.ts app/api/collection/route.ts app/api/identify/route.ts app/api/observations/route.ts app/api/plants/[id]/route.ts app/api/profile/route.ts
git commit -m "test: establish canonical plant catalog"
```

---

## Task 2: 타입과 읽기 전용 mock fixture를 백엔드 계약에 맞추기

**Files:**

- Modify: `types/plant.ts`
- Modify: `types/identify.ts`
- Modify: `types/domain.ts`
- Modify: `types/user.ts`
- Create: `data/mock.ts`
- Keep temporarily: `data/mock-plants.ts`, `app/identify/result/mocks.ts`, result-only type files

- [ ] **Step 1: 유지할 핵심 타입을 명확히 정리**

`types/domain.ts`는 다음 핵심 union을 제공한다.

```ts
export type PlantStage = 1 | 2 | 3;
export type RarityCode = "common" | "uncommon" | "rare";
export type PlantOrgan = "auto" | "flower" | "leaf" | "fruit";
export type PlantPart = PlantOrgan; // 소비자 전환 중에만 유지
```

서로 다른 공식/비공식 상세 응답을 한 화면에 전달하기 위한 정규화 타입만 `types/plant.ts`에 추가한다.

```ts
import type { PlantId, RarityCode } from "./domain";

export interface PlantDetailScreenData {
  official: boolean;
  id?: PlantId;
  koreanName: string;
  scientificName: string;
  description: string;
  imageUrl: string | null;
  rarity: RarityCode | null;
  observationCount: number;
  firstObservedAt: string;
  informationSource: string;
}

export interface ForestPlantDetailDto {
  koreanName: string;
  scientificName: string;
  description: string | null;
  informationSource: "산림청 국립수목원";
  informationSourceUrl: "https://www.data.go.kr/data/15143513/openapi.do";
}
```

이 단계에서는 기존 소비자를 깨지 않도록 `PlantCategory`, `PlantSlug`, `PlantSpecies`, `CollectedPlant`를 아직 삭제하지 않는다. 새 fixture와 새 데이터 계층에서는 사용하지 않고, 화면 전환이 끝난 Task 9에서 제거한다. `types/identify.ts`에 `IdentifyStep`을 아래처럼 추가한다.

```ts
export type IdentifyStep =
  | "confirm"
  | "analyzing"
  | "candidates"
  | "failed"
  | "result";
```

`types/user.ts`에는 두 화면이 실제로 소비하는 조합만 추가한다.

```ts
import type { ObservationDto } from "./observation";
import type { CollectionPlantDto, OtherFindingDto } from "./plant";

export type HomeData = {
  profile: Profile;
  levelTitle: string;
  totalObservations: number;
  completionRate: number;
  recentPlants: Array<CollectionPlantDto | OtherFindingDto>;
};

export type ProfilePageData = ProfileResponse & {
  levelTitle: string;
  recentObservations: ObservationDto[];
};
```

`CreateObservationResponseDto.result`의 기존 `"new" | "duplicate"` discriminant는 그대로 유지한다. 별도 new/duplicate 화면 ViewModel은 추가하지 않는다.

- [ ] **Step 2: collection 계약에 총 관찰 수를 추가**

`CollectionResponseDto`의 필드명을 `plants` → `officialPlants`, `others` → `otherFindings`로 명확히 바꾸고, `summary`에 아래 필드를 추가해 홈·도감·프로필의 집계가 같은 의미를 쓰게 한다.

```ts
summary: {
  total: number;
  collected: number;
  totalObservations: number;
  completionRate: number;
};
```

각 공식 카드에는 `collected`, `observationCount`, `representativeImageUrl`, `firstObservedAt`, `lastObservedAt`가 있으며 미수집 항목은 image/date가 `null`이다. 기타 발견 DTO는 `scientificName`으로 묶이고 같은 집계 필드를 쓴다.

- [ ] **Step 3: `data/mock.ts`에 서버 응답 형태의 fixture 한 벌 작성**

다음 상수만 export한다.

```ts
export const MOCK_PROFILE: ProfileResponse;
export const MOCK_OBSERVATIONS: readonly ObservationDto[];
export const MOCK_FOREST_DETAILS: Readonly<Record<string, ForestPlantDetailDto>>;
export const MOCK_IDENTIFY_RESPONSES: Readonly<Record<PlantOrgan, IdentifyResponseDto>>;
export const MOCK_NEW_OBSERVATION_RESULT: CreateObservationResponseDto;
export const MOCK_DUPLICATE_OBSERVATION_RESULT: CreateObservationResponseDto;
```

규칙:

- 관찰 fixture의 공식 여부를 직접 저장하지 않고 `OFFICIAL_PLANTS`의 학명 포함 여부로 판단한다.
- 사용자 사진은 `imageUrl`, 촬영 시점은 ISO `observedAt`만 쓴다.
- 산림청 상세 fixture는 `koreanName`, `scientificName`, `description`, `informationSource`처럼 화면이 실제 응답에서 받을 이름을 사용한다.
- PlantNet 후보 fixture는 꽃·잎·열매 선택이 실제로 전달되는지 시험할 수 있게 organ별 top candidate가 다르게 구성한다.
- 공식 기존 관찰 후보를 저장하면 duplicate fixture, 미수집 공식 또는 비공식 후보를 저장하면 new fixture가 선택될 수 있게 id를 맞춘다.

- [ ] **Step 4: 타입체크로 계약 확인**

Run: `npm run typecheck`
Expected: PASS. `PlantPart = PlantOrgan` alias와 기존 화면 전용 타입은 소비자 전환 중에만 유지한다. category/season 필드는 새 fixture에 넣지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add types data/mock.ts
git commit -m "refactor: align mock fixtures with backend contracts"
```

---

## Task 3: 비동기 데이터 접근 계층을 테스트 우선으로 만들기

**Files:**

- Modify: `lib/data.test.ts`
- Create: `lib/data.ts`
- Modify: `app/api/collection/route.ts`
- Modify: `app/api/profile/route.ts`

- [ ] **Step 1: 데이터 계층의 사용자 관점 동작 테스트 작성**

`lib/data.test.ts`에 다음 행위를 검증한다.

```ts
import { describe, expect, it } from "vitest";
import {
  getCollectionData,
  getFindingDetail,
  getHomeData,
  getMockIdentifyResult,
  getMockObservationResult,
  getPlantDetail,
  getProfileData,
  searchPlants,
} from "@/lib/data";

describe("mock data access", () => {
  it("derives one consistent total from observations", async () => {
    const [home, collection, profile] = await Promise.all([
      getHomeData(),
      getCollectionData(),
      getProfileData(),
    ]);

    expect(home.totalObservations).toBe(collection.summary.totalObservations);
    expect(profile.stats.totalObservations).toBe(collection.summary.totalObservations);
  });

  it("always returns all 50 official plants in id order", async () => {
    const collection = await getCollectionData();
    expect(collection.officialPlants).toHaveLength(50);
    expect(collection.officialPlants.map(({ id }) => id)).toEqual(
      [...collection.officialPlants].sort((a, b) => a.id - b.id).map(({ id }) => id),
    );
  });

  it("derives collection status, count, and representative image", async () => {
    const collection = await getCollectionData();
    const collected = collection.officialPlants.find((plant) => plant.collected);
    const locked = collection.officialPlants.find((plant) => !plant.collected);
    expect(collected?.observationCount).toBeGreaterThan(0);
    expect(collected?.representativeImageUrl).toBeTruthy();
    expect(locked?.representativeImageUrl).toBeNull();
  });

  it("groups observations outside the official catalog as findings", async () => {
    const collection = await getCollectionData();
    expect(collection.otherFindings.length).toBeGreaterThan(0);
    expect(collection.otherFindings.every(({ observationCount }) => observationCount > 0)).toBe(true);
  });

  it("allows detail only for collected official plants", async () => {
    const collection = await getCollectionData();
    const collected = collection.officialPlants.find((plant) => plant.collected)!;
    const locked = collection.officialPlants.find((plant) => !plant.collected)!;
    expect(await getPlantDetail(collected.id)).not.toBeNull();
    expect(await getPlantDetail(locked.id)).toBeNull();
  });

  it("finds an unofficial observation by scientific name", async () => {
    const collection = await getCollectionData();
    const finding = collection.otherFindings[0];
    expect(await getFindingDetail(finding.scientificName)).toMatchObject({ official: false });
  });

  it("searches the official catalog by Korean or scientific name", async () => {
    const collection = await getCollectionData();
    const target = collection.officialPlants[0];
    await expect(searchPlants(target.koreanName)).resolves.toContainEqual(target);
    await expect(searchPlants(target.scientificName)).resolves.toContainEqual(target);
  });

  it("selects identify fixtures by organ", async () => {
    const flower = await getMockIdentifyResult("flower");
    const leaf = await getMockIdentifyResult("leaf");
    expect(flower.candidates[0].scientificName).not.toBe(leaf.candidates[0].scientificName);
  });

  it("returns new or duplicate observation result from current observations", async () => {
    const collection = await getCollectionData();
    const existing = collection.officialPlants.find((plant) => plant.collected)!;
    const unseen = collection.officialPlants.find((plant) => !plant.collected)!;
    const candidates = (await getMockIdentifyResult("flower")).candidates;
    const candidateFor = (plant: typeof existing) => ({
      ...candidates[0],
      plantId: plant.id,
      official: true,
      matchType: "exact" as const,
      koreanName: plant.koreanName,
      scientificName: plant.scientificName,
      scientificNameWithAuthor: plant.scientificName,
      stage: plant.stage,
      rarity: plant.rarity,
    });
    await expect(
      getMockObservationResult(candidateFor(existing)),
    ).resolves.toMatchObject({ result: "duplicate" });
    await expect(
      getMockObservationResult(candidateFor(unseen)),
    ).resolves.toMatchObject({ result: "new" });
  });
});
```

후보 DTO의 실제 이름이 `score`가 아니라면 현재 `IdentifyCandidateDto`의 정확한 필드명으로 테스트를 맞춘다. 의미를 바꾸는 새 ViewModel은 만들지 않는다.

Run: `npm test -- lib/data.test.ts`
Expected: FAIL because functions are absent or incomplete.

- [ ] **Step 2: `lib/data.ts`를 작은 단일 모듈로 구현**

다음 async 공개 함수만 제공한다.

```ts
export async function getHomeData(): Promise<HomeData>;
export async function getCollectionData(): Promise<CollectionResponseDto>;
export async function getProfileData(): Promise<ProfilePageData>;
export async function getPlantDetail(id: number): Promise<PlantDetailScreenData | null>;
export async function getFindingDetail(
  scientificName: string,
): Promise<PlantDetailScreenData | null>;
export async function searchPlants(query: string): Promise<CollectionPlantDto[]>;
export async function getMockIdentifyResult(
  organ: PlantOrgan,
): Promise<IdentifyResponseDto>;
export async function getMockObservationResult(
  candidate: IdentifyCandidateDto,
): Promise<CreateObservationResponseDto>;
```

구현 규칙:

- 작은 private helper `groupObservationsByScientificName`, `getRepresentativeObservation`, `getLevelTitle`만 허용한다.
- 관찰 집계는 모든 공개 함수가 동일 helper를 사용한다.
- `getPlantDetail`은 공식 목록에 있어도 관찰이 없으면 `null`을 반환한다.
- `getFindingDetail`은 공식 목록에 없는 관찰만 반환한다.
- `searchPlants("")`는 공식 50종 전체를 반환한다.
- 모든 반환 배열과 객체는 fixture를 직접 mutate하지 않고 새 값을 만든다.
- artificial delay는 넣지 않는다. async 경계만 보존한다.

- [ ] **Step 3: API route 집계도 같은 명칭에 맞춤**

`app/api/collection/route.ts`의 `summary.totalObservations`를 실제 관찰 개수로 계산한다. `app/api/profile/route.ts`도 `observedAt`과 동일한 집계 의미를 사용한다. 서버 route가 `lib/data.ts` mock accessor를 직접 호출하지는 않는다.

- [ ] **Step 4: 테스트와 타입 검증**

Run: `npm test -- lib/data.test.ts`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add lib/data.ts lib/data.test.ts app/api/collection/route.ts app/api/profile/route.ts types
git commit -m "refactor: centralize async mock data access"
```

---

## Task 4: 역할 기반 토큰과 최소 공용 UI 정리

**Files:**

- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/ui/Button.tsx`
- Modify: `components/layout/PageHeader.tsx`
- Modify: `components/home/ProgressBar.tsx`
- Modify: `components/plants/RarityBadge.tsx`
- Modify: `components/plants/PlantCard.tsx`
- Modify: `components/ui/PlantPlaceholder.tsx`
- Modify: `components/layout/BottomNav.tsx`
- Keep temporarily: wrappers and old UI components until all consumers migrate

- [ ] **Step 1: semantic token set 정의**

`app/globals.css`의 `:root`를 다음 역할 중심 이름으로 정리한다. 기존 실제 색상값은 가능한 한 그대로 옮겨 시각 변화 폭을 제한한다.

```css
:root {
  --color-background: #f7f8f2;
  --color-surface: #ffffff;
  --color-primary: #2f6b4f;
  --color-primary-strong: #173c2d;
  --color-accent: #ddeb98;
  --color-text: #203229;
  --color-text-muted: #718078;
  --color-border: #dfe5df;
  --color-info-surface: #eef3ea;
  --color-placeholder: #dcece2;
  --color-rarity-common-surface: #ddeb98;
  --color-rarity-uncommon-surface: #f6e7a6;
  --color-rarity-rare-surface: #c3d9ce;
  --radius-card: 20px;
  --radius-control: 16px;
  --radius-pill: 9999px;
}
```

기존 토큰은 소비자 전환 중에만 아래 compatibility alias로 남기고 Task 9에서 제거한다.

```css
--color-bg: var(--color-background);
--color-deep: var(--color-primary-strong);
--color-lime: var(--color-accent);
--color-sun: #f6e7a6;
--color-black-text: var(--color-text);
--color-sub: var(--color-text-muted);
--color-white: var(--color-surface);
--radius-button: var(--radius-control);
```

정적 inline style은 해당 토큰과 Tailwind class로 바꾼다. 애니메이션 keyframe이 실제로 필요한 경우만 globals에 둔다.

- [ ] **Step 2: 전역 아이콘 CDN 제거**

`app/layout.tsx`의 Remix Icon stylesheet `<link>`를 제거한다. 이후 모든 아이콘은 `@remixicon/react` 컴포넌트 import만 사용한다.

- [ ] **Step 3: 최소 공용 컴포넌트 API를 통일**

- `Button`: `variant="primary" | "secondary" | "ghost"`, `disabled`, `className`, native button props.
- `PageHeader`: `variant="default" | "identify"`, title, optional back/action slots.
- `ProgressBar`: `value`, `max`, accessible label. 동적 width만 inline style 허용.
- `RarityBadge`: `rarity: RarityCode` 하나를 입력받아 문구·색상을 내부에서 결정.
- `PlantCard`: 공식/기타 카드의 공통 frame만 담당하고 잠금 여부와 link target을 명시적 props로 받음.
- `PlantPlaceholder`: 잠긴 공식 식물 사진에 물음표와 accessible label 표시.
- `BottomNav`: 문자열 icon class 대신 React icon 컴포넌트 사용.

한 컴포넌트에서만 쓰는 layout wrapper는 만들지 않는다.

- [ ] **Step 4: 정적 품질 검증**

Run: `rg 'remixicon\.com|className="ri-|style=\{\{' app components`
Expected: runtime 계산 style 외에는 결과가 없어야 한다. 아직 마이그레이션 전 소비자는 목록으로 기록하고 Task 5~7에서 제거한다.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/globals.css app/layout.tsx components/ui components/layout components/home/ProgressBar.tsx components/plants/PlantCard.tsx components/plants/RarityBadge.tsx
git commit -m "refactor: unify semantic tokens and shared UI"
```

---

## Task 5: 홈·프로필·로그인·설정 route를 새 데이터/스타일 규칙으로 전환

**Files:**

- Modify: `app/page.tsx`
- Modify: `components/home/HomeScreen.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `components/profile/ProfileScreen.tsx`
- Delete: `app/profile/ProfileScreen.tsx`
- Modify: `app/login/page.tsx`
- Modify: `components/login/LoginScreen.tsx`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: route 파일을 async 데이터 경계로 변경**

```tsx
export default async function HomePage() {
  const data = await getHomeData();
  return <HomeScreen data={data} />;
}
```

프로필도 동일하게 `getProfileData()`를 await한다. route는 데이터 로드와 not-found/redirect만 담당하고 UI 조건은 Screen에 전달한다.

- [ ] **Step 2: HomeScreen을 props 기반으로 전환**

- raw mock import와 화면 내부 집계 제거.
- 최근 관찰, 누적 관찰 수, 공식 수집률은 `HomeData`에서 렌더링.
- 자체 progress markup 대신 `ProgressBar` 사용.
- 최근 항목은 수집된 공식 식물만 `/plants/{id}`로 연결하고, 비공식 항목이 포함되면 `/findings/{encodeURIComponent(scientificName)}`로 연결한다.

- [ ] **Step 3: ProfileScreen을 props 기반으로 전환**

- raw mock import와 중복 집계 제거.
- 프로필 통계와 최근 활동은 `ProfilePageData` 사용.
- 자체 progress markup 대신 `ProgressBar` 사용.
- 설정 버튼은 렌더하지 않고 header action 위치에 다음 정도의 단일 TODO만 남긴다.

```tsx
{/* TODO: 백엔드 프로필 수정 범위가 확정되면 설정 진입점을 복원한다. */}
```

단순 재-export 파일 `app/profile/ProfileScreen.tsx`는 참조가 없음을 확인한 뒤 삭제한다.

- [ ] **Step 4: 로그인 미연결 기능의 상태를 명확히 표시**

Google 로그인과 회원가입 버튼은 화면에 유지하지만 `disabled`와 `aria-disabled`를 적용하고, 문구에 `준비 중`을 표시한다. 실제 auth 호출, session 저장, 가짜 성공 이동은 만들지 않는다.

- [ ] **Step 5: settings route 보존**

`app/settings/page.tsx`는 UI를 새로 만들지 않고 서버 redirect로 `/profile`에 보낸다.

```tsx
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/profile");
}
```

- [ ] **Step 6: 검증**

Run: `rg '@/data/|from "@/lib/data"' app/page.tsx app/profile components/home components/profile`
Expected: pages만 `@/lib/data`를 import하고 Screen에는 raw data import가 없어야 한다.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add app/page.tsx app/profile app/login app/settings components/home components/profile components/login
git commit -m "refactor: make primary screens data driven"
```

---

## Task 6: 도감·검색·공식/기타 상세 흐름 구현

**Files:**

- Modify: `app/collection/page.tsx`
- Modify: `components/collection/CollectionScreen.tsx`
- Delete: `components/collection/CollectionEmptyState.tsx`
- Modify: `app/search/page.tsx`
- Modify: `components/search/SearchScreen.tsx`
- Modify: `app/plants/[id]/page.tsx`
- Modify: `components/plants/PlantDetailScreen.tsx`
- Create: `app/findings/[scientificName]/page.tsx`

- [ ] **Step 1: collection page에서 데이터 로드**

`app/collection/page.tsx`는 `getCollectionData()`만 호출하고 `CollectionScreen`에 전달한다. 공식 50종은 항상 있으므로 full-page empty 분기와 `CollectionEmptyState`를 제거한다.

- [ ] **Step 2: collection 탭을 두 개로 고정**

`CollectionScreen` 내부 UI state는 `"official" | "other"`만 사용한다.

- 공식 도감: 50종을 id 순서로 모두 표시한다.
- 수집됨: 사용자 대표 사진, 이름, 희귀도, 발견 횟수, `/plants/{id}` link.
- 미수집: 이름과 희귀도는 표시, 사진 영역은 `PlantPlaceholder`, link/button은 만들지 않음.
- 기타 발견: 관찰된 비공식 식물만 표시하고 `/findings/{encodeURIComponent(scientificName)}`로 연결.
- 기타 발견이 없으면 탭 내부에 짧은 빈 상태 문구만 표시.
- category filter와 season UI는 모두 제거.

- [ ] **Step 3: 일반 검색을 공식 카탈로그 검색으로 변경**

`app/search/page.tsx`에서 `searchParams.mode`를 읽고 기본 mode에서는 `searchPlants("")`로 초기 50종을 전달한다. `SearchScreen`은 한국어명·학명으로 클라이언트 필터링하거나 query 변경 때 작은 async accessor를 호출하되 raw data를 import하지 않는다.

일반 mode 규칙:

- 수집된 항목만 상세 link.
- 미수집 항목은 이름을 표시하되 잠긴 사진과 비활성 상태.
- category chip 제거.

identify mode 규칙은 Task 7에서 연결하므로 이 단계에서는 `mode` prop과 선택 callback 자리를 기존 동작을 깨지 않는 최소 형태로 둔다.

- [ ] **Step 4: 공식 상세 route 접근 제어**

`app/plants/[id]/page.tsx`에서 route param을 숫자로 변환하고 `getPlantDetail(id)`를 호출한다. 숫자가 아니거나, 공식 목록에 없거나, 공식이지만 미수집이면 `notFound()`를 호출한다.

`PlantDetailScreen`은 정규화된 `PlantDetailScreenData`만 받고, 희귀도는 `RarityBadge`, 날짜는 `observedAt`을 locale format한 값으로 표시한다.

- [ ] **Step 5: 기타 발견 상세 route 추가**

`app/findings/[scientificName]/page.tsx`는 param을 decode하여 `getFindingDetail`을 호출하고, 없으면 `notFound()`한다. 같은 `PlantDetailScreen`을 사용하고 rarity가 `null`이면 badge 영역을 렌더하지 않는다.

- [ ] **Step 6: 검증**

Run: `npm test -- lib/data.test.ts`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

Run: `rg 'category|season|observedSeason|CollectionEmptyState' app components types data lib`
Expected: 사용자 설명 문구가 아닌 코드 식별자/필드는 0건.

- [ ] **Step 7: 커밋**

```bash
git add app/collection app/search app/plants app/findings components/collection components/search components/plants types
git commit -m "feat: unify catalog search and plant details"
```

---

## Task 7: PlantNet organ 전달과 식별 session lifecycle 정리

**Files:**

- Modify: `lib/api.ts`
- Modify: `app/api/identify/route.ts`
- Modify: `lib/identify-storage.ts`
- Modify: `hooks/useCaptureSession.ts`
- Modify: `hooks/useIdentifyAnalysis.ts`
- Modify: `components/capture/CaptureScreen.tsx`
- Modify: `components/identify/ConfirmScreen.tsx`
- Modify: `app/identify/page.tsx`
- Modify: `components/identify/AnalyzingScreen.tsx`

- [ ] **Step 1: API client에 organ을 명시적으로 전달**

```ts
export async function identifyPlant(
  image: Blob,
  organ: PlantOrgan,
): Promise<IdentifyResponseDto> {
  const formData = new FormData();
  formData.append("image", image);
  if (organ !== "auto") formData.append("organ", organ);
  // 기존 fetch와 response validation 유지
}
```

`auto`는 PlantNet에 `organs`를 보내지 않고 자동 판별을 사용한다.

- [ ] **Step 2: identify API route에서 organ 검증**

허용 집합은 `flower`, `leaf`, `fruit`뿐이다. `auto` 또는 누락은 PlantNet multipart body의 `organs` 필드를 생략한다. 유효한 값은 `plantNetForm.append("organs", organ)`으로 전달하고, 그 외 문자열은 400을 반환한다. `bark`와 category 변환 로직은 제거한다.

- [ ] **Step 3: sessionStorage key와 lifecycle 통일**

`lib/identify-storage.ts`는 다음 key만 관리한다.

```ts
const IDENTIFY_KEYS = {
  draftImage: "identify:draft-image",
  organ: "identify:organ",
  candidates: "identify:candidates",
  result: "identify:result",
} as const;
```

공개 helper:

```ts
readIdentifyDraft();
writeIdentifyDraft(imageUrl, organ);
readIdentifyCandidates();
writeIdentifyCandidates(response);
readIdentifyResult();
writeIdentifyResult(result);
clearIdentifySession();
```

JSON parse 실패는 해당 값만 제거하고 `null`을 반환한다. 다른 local/session key는 건드리지 않는다.

- [ ] **Step 4: capture와 confirm 화면 연결**

- 새 촬영 시작 시 `clearIdentifySession()`으로 이전 candidates/result 제거.
- confirm 화면에서 사용자가 `auto | flower | leaf | fruit`를 선택.
- 확인 시 draft image와 organ을 저장하고 `/identify`로 이동.
- 정적인 선택 UI는 Tailwind와 `Button`을 사용.

- [ ] **Step 5: 분석 hook에서 mock/API 경계를 한 곳에 둠**

현재 백엔드 미연결 상태에서는 `useIdentifyAnalysis`가 `getMockIdentifyResult(organ)`을 await한다. 나중에 연결할 지점은 이 한 곳의 `identifyPlant(blob, organ)` 교체로 한정한다.

hook은 `status`, `response`, `error`, `retry`만 반환한다. `setState`를 effect 본문에서 동기 호출해 발생하는 현재 lint 오류를 없애고, async function 안에서 결과에 따라 상태를 전환한다.

- [ ] **Step 6: 검증**

Run: `npm test -- lib/data.test.ts`
Expected: organ fixture test PASS.

Run: `npm run lint`
Expected: `app/identify/page.tsx`의 synchronous setState effect 오류가 사라짐.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add lib/api.ts lib/identify-storage.ts app/api/identify app/capture app/identify hooks components/capture components/identify types
git commit -m "refactor: make plant organ explicit in identify flow"
```

---

## Task 8: 후보·수동 검색·new/duplicate 결과를 `/identify` 하나로 통합

**Files:**

- Modify: `app/identify/page.tsx`
- Modify: `components/identify/CandidatesScreen.tsx`
- Modify: `components/identify/FailedScreen.tsx`
- Create: `components/identify/IdentifyResultScreen.tsx`
- Modify: `components/search/SearchScreen.tsx`
- Modify: `app/search/page.tsx`
- Modify: `components/layout/PageHeader.tsx`
- Delete: `components/identify/IdentifyFlowHeader.tsx`
- Delete: `app/identify/result/new/page.tsx`
- Delete: `app/identify/result/new/NewPlantRewardScreen.tsx`
- Delete: `app/identify/result/new/RewardPlantCard.tsx`
- Delete: `app/identify/result/new/new-plant-reward.module.css`
- Delete: `app/identify/result/duplicate/page.tsx`
- Delete: `app/identify/result/duplicate/DuplicateObservationScreen.tsx`
- Delete: `app/identify/result/duplicate/duplicate-observation.module.css`
- Delete: `app/identify/result/IdentifyResultShell.tsx`
- Delete: `app/identify/result/mocks.ts`
- Delete: `app/identify/result/types.ts`

- [ ] **Step 1: `/identify`의 상태 전이를 한 군데에 구현**

```text
confirm -> analyzing -> candidates -> result
                    \-> failed -> retry/search
candidates -> /search?mode=identify -> /identify result
```

`app/identify/page.tsx`는 저장된 draft/candidates/result를 읽어 `IdentifyStep`을 결정한다. URL에 new/duplicate route를 만들지 않는다.

- [ ] **Step 2: 후보 선택을 observation 결과 생성에 연결**

후보 선택 시 `getMockObservationResult(candidate, draftImage)`를 await하고 result를 sessionStorage에 저장한 뒤 step을 `result`로 변경한다. DTO를 직접 `CandidateScreen`에 전달하며 `CandidateCardViewModel`을 만들지 않는다. confidence 표시는 작은 `formatConfidence(score)` 함수만 허용한다.

- [ ] **Step 3: 수동 공식 식물 선택 mode 연결**

`FailedScreen`과 `CandidateScreen`의 “직접 찾기”는 `/search?mode=identify`로 이동한다. identify mode의 `SearchScreen`은 공식 50종 모두를 선택 가능하게 표시한다. 선택 시 해당 공식 식물을 `IdentifyCandidateDto` 모양으로 최소 변환해 mock observation result를 만들고 `/identify`로 돌아간다.

일반 `/search`와 달리 identify mode에서는 미수집 공식 식물도 선택 가능하다. 임의 텍스트로 비공식 식물을 생성하는 기능은 넣지 않는다.

- [ ] **Step 4: 하나의 결과 화면에서 discriminated union 렌더링**

`IdentifyResultScreen.tsx` 한 파일 안에서 다음처럼 분기한다.

```tsx
if (response.result === "new") {
  return <NewPlantContent response={response} imageUrl={imageUrl} />;
}

return <DuplicatePlantContent response={response} imageUrl={imageUrl} />;
```

두 내부 컴포넌트는 이 파일 밖으로 export하지 않는다. 공통 header/footer와 계속 버튼은 한 번만 둔다. CSS module은 만들지 않고 Tailwind + semantic variable을 쓴다. 계속 버튼은 session을 모두 지운 뒤 `/collection`으로 이동한다.

- [ ] **Step 5: header 중복 제거**

`IdentifyFlowHeader` 기능을 `PageHeader variant="identify"`로 흡수하고, 참조가 0건이면 파일을 삭제한다.

- [ ] **Step 6: 과거 result route와 타입 삭제**

Run: `rg 'identify/result|NewPlantResult|DuplicateResult|NewPlantRewardViewModel|DuplicateObservationViewModel' app components hooks lib types`

검색 결과를 새 단일 화면으로 모두 이관한 뒤 위 파일을 삭제한다. 식별 상태 복구가 `/identify` 하나에서 되는지 확인한다.

- [ ] **Step 7: 검증**

Run: `npm test`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 8: 커밋**

```bash
git add app/identify app/search components/identify components/search components/layout/PageHeader.tsx lib types
git commit -m "refactor: consolidate identify results into one flow"
```

---

## Task 9: 임시 호환 코드·중복 파일·미사용 UI와 asset 제거

**Files:**

- Delete: `data/official-plants.ts`
- Delete: `data/plant-species.ts`
- Delete: `data/mock-plants.ts`
- Delete if unused: `components/ui/PrimaryButton.tsx`
- Delete if unused: `components/ui/SecondaryButton.tsx`
- Delete if unused: `components/ui/CandidateCard.tsx`
- Delete if unused: `components/ui/CircularProgress.tsx`
- Delete if unused: `components/ui/InfoBox.tsx`
- Delete if unused: `components/ui/PlantPreviewCard.tsx`
- Delete if unused: `components/ui/SelectionChips.tsx`
- Delete if unused: `components/ui/StepIndicator.tsx`
- Modify: `types/*`
- Modify: `app/globals.css`
- Modify: `docs/api.md`
- Modify: `supabase/seed.sql`
- Delete if unused: `public/window.svg`, `public/vercel.svg`, `public/next.svg`, `public/globe.svg`, `public/file.svg`
- Delete if unused: `public/plants/azalea.svg`, `public/plants/korean-azalea.svg`, `public/plants/royal-azalea.svg`

- [ ] **Step 1: raw data import가 데이터 계층 밖에 없는지 확인**

Run: `rg '@/data/' app components hooks lib --glob '!lib/data.ts' --glob '!app/api/**'`
Expected: 0 results.

API route의 공식 목록 import는 `@/data/plants`만 허용하고, 화면 fixture import는 금지한다.

- [ ] **Step 2: 중복 데이터 파일 삭제**

Run: `rg 'official-plants|plant-species|mock-plants|identify/result/mocks' . --glob '!docs/**' --glob '!node_modules/**'`
Expected: 0 results before deletion.

그 뒤 세 data 파일과 남아 있는 old result mock을 삭제한다.

`docs/api.md`와 `supabase/seed.sql`의 관리 파일 안내도 `data/plants.ts`로 갱신한다. SQL 구조나 seed 값은 바꾸지 않는다.

- [ ] **Step 3: 얇거나 미사용인 공용 컴포넌트 삭제**

각 파일명을 `rg`로 검색해 import가 0건인 항목만 삭제한다. `PrimaryButton`/`SecondaryButton` 소비자는 `Button variant`로 이미 전환되어 있어야 한다. 한 화면에서만 쓰이던 wrapper가 남았다면 화면 내부의 작은 JSX로 합친다.

- [ ] **Step 4: 임시 타입 alias와 legacy token 제거**

Task 2에서 둔 compatibility alias를 제거한다. 다음 검색의 코드 결과가 없어야 한다.

Run: `rg 'PlantCategory|PlantSlug|PlantSpecies|CollectedPlant|CollectionSummary|UserProgress|NewPlantRewardViewModel|DuplicateObservationViewModel|CandidateCardViewModel|observedSeason|season' app components data hooks lib types`

Run: `rg -- '--color-(deep|lime|sun)|var\(--(deep|lime|sun)' app components`

legacy CSS token과 undefined token을 제거한다.

- [ ] **Step 5: 미사용 asset 삭제**

각 public 경로와 파일명을 `rg`로 검색한다. 코드·CSS·manifest에서 참조가 0건인 목록만 삭제한다. 사용자 데이터/fixture가 참조하는 이미지는 유지한다.

- [ ] **Step 6: 이미지 사용 규칙 확인**

- 정적 public asset은 `next/image` 사용.
- 촬영 data URL과 PlantNet 외부 URL은 크기를 명시한 `<img>` 허용.
- lint disable은 해당 동적 이미지 한 줄에만 국소적으로 둔다.

- [ ] **Step 7: 검증과 커밋**

Run: `npm test`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

```bash
git add -A
git commit -m "chore: remove obsolete frontend abstractions"
```

---

## Task 10: production build와 핵심 경로 smoke test

**Files:**

- Modify only if verification reveals an in-scope regression

- [ ] **Step 1: 전체 자동 검증을 새 출력으로 실행**

Run: `npm test`
Expected: all catalog and data tests PASS.

Run: `npm run lint`
Expected: 0 errors.

Run: `npm run typecheck`
Expected: 0 errors.

Run (PowerShell):

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:SUPABASE_SECRET_KEY='dummy-review-key'
npm run build
```

Expected: production build PASS. 이 값은 build-time validation 전용이며 `.env`에 저장하지 않는다.

- [ ] **Step 2: 로컬 앱에서 핵심 경로 확인**

Run: `npm run dev`

다음을 브라우저에서 확인한다.

1. `/` — 홈 통계·최근 관찰·하단 내비게이션 표시.
2. `/collection` — 공식 50종 전부 표시, 수집/잠금 상태, 기타 발견 탭.
3. 잠긴 공식 카드 — 클릭/상세 진입 불가.
4. 수집 공식 카드 → `/plants/{id}` 상세 표시.
5. 기타 발견 카드 → `/findings/{scientificName}` 상세 표시.
6. `/search` — 이름/학명 검색, 잠금 규칙 유지.
7. `/capture` → confirm → organ 선택 → analyze → candidates.
8. 후보 선택 → 같은 `/identify`에서 new 또는 duplicate 결과 표시.
9. 후보 없음/직접 찾기 → `/search?mode=identify` → 공식 식물 선택 → `/identify` 결과.
10. 결과 계속 → session 정리 후 `/collection` 이동.
11. `/login` — Google/회원가입 준비 중 비활성.
12. `/profile` — 설정 버튼 숨김, 집계 일치.
13. `/settings` — `/profile` redirect.

- [ ] **Step 3: 저장소 상태와 기준 커밋 이후 diff 확인**

Run: `git status --short`
Expected: 의도한 변경만 존재.

Run: `git diff --stat bde4e7ee172c5fb11d24531d388fb71f3acda7c4..HEAD`
Expected: 설계 범위를 벗어난 backend schema, auth integration, unrelated files가 없어야 한다.

- [ ] **Step 4: 검증 중 수정이 있었다면 마지막 커밋**

```bash
git add <verification-fix-files>
git commit -m "fix: resolve frontend integration regressions"
```

`<verification-fix-files>`는 실제로 수정된 파일 경로로 바꾸며, 수정이 없으면 커밋하지 않는다.

## Completion criteria

- 공식 50종의 원본은 `data/plants.ts` 한 벌뿐이다.
- mock 화면 데이터의 원본은 `data/mock.ts`, 접근점은 async `lib/data.ts` 한 곳뿐이다.
- route는 얇고 Screen은 props 기반이며 raw mock import가 없다.
- 도감/검색/상세의 수집·잠금·비공식 규칙이 일치한다.
- 식별 organ이 confirm부터 PlantNet API 계약까지 손실 없이 전달된다.
- new/duplicate 결과가 `/identify` 한 흐름과 한 결과 파일로 통합된다.
- category/season/slug/localStorage/중복 wrapper/legacy icon CDN이 없다.
- Vitest, lint, typecheck, production build와 핵심 수동 smoke test가 모두 통과한다.
