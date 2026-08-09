// ---------------------------------------------------------------------------
// 화면용 타입 (목업 데이터, components/, 도감 화면에서 사용)
// ---------------------------------------------------------------------------

export type Rarity = "흔함" | "보통" | "드묾";
export type PlantCategory = "꽃" | "풀" | "나무";

// 공식 도감에 등록된 식물 마스터 데이터
export interface PlantSpecies {
    id: string;
    koreanName: string; // 한국어 이름 (ex. 산철쭉)
    scientificName: string; // 학명 (ex. Rhododendron yedoense)
    category: PlantCategory;
    rarity: Rarity;
    description: string; // 주요 특징 설명 (정적 데이터)
    season?: string; // 대표 관찰 시기 (ex. "봄 · 연분홍 꽃")
    imageUrl?: string;
}

// 사용자가 실제로 수집한 식물 카드 (관찰 기록 포함)
export interface CollectedPlant {
    speciesId: string; // PlantSpecies.id 참조
    koreanName: string;
    scientificName: string;
    category: PlantCategory;
    rarity: Rarity;
    description: string;
    userPhotoUrl: string; // 사용자가 촬영한 대표 사진
    firstFoundAt: string; // ISO date string, 최초 발견일
    observationCount: number; // 관찰(재촬영) 횟수
}

// 도감 전체 요약 정보 (홈, 도감 화면 상단 표시용)
export interface CollectionSummary {
    totalSpeciesFound: number; // 발견한 공식 식물 종 수
    totalOfficialSpecies: number; // 공식 도감 전체 종 수
    totalObservations: number; // 총 관찰 횟수
    completionRate: number; // 도감 완성률
}

// 사용자 레벨/경험치 정보
export interface UserProgress {
    nickname: string;
    level: number;
    levelTitle: string; // 예: "새싹 관찰자"
    currentXp: number;
    xpToNextLevel: number; // 다음 레벨까지 남은 XP
}

// ---------------------------------------------------------------------------
// API 응답 타입 (app/api/, lib/api.ts에서 사용)
// ---------------------------------------------------------------------------

/**
 * DB에 저장되는 희귀도 값입니다. 화면에 그대로 쓰지 말고 RARITY_LABEL로 바꿔 주세요.
 * 위쪽 Rarity("흔함" | "보통" | "드묾")가 화면 표기용입니다.
 */
export type RarityCode = 'common' | 'uncommon' | 'rare'

/** DB 값을 화면 표기로 바꾸는 표입니다. */
export const RARITY_LABEL: Record<RarityCode, Rarity> = {
  common: '흔함',
  uncommon: '보통',
  rare: '드묾',
}

/**
 * 공식 도감에 붙은 방식입니다.
 * - exact: 학명이 그대로 일치
 * - genus: 속이 같고 그 속의 공식 식물이 하나뿐이라 연결 (Pl@ntNet이 절 이름이나 동의어를 준 경우)
 * - null: 공식 도감에 없음
 */
export type MatchType = 'exact' | 'genus' | null

/** POST /api/identify 후보 하나. plantId가 null이면 공식 도감에 없는 기타 식물입니다. */
export type PlantCandidate = {
  plantId: number | null
  official: boolean
  matchType: MatchType
  koreanName: string
  scientificName: string
  scientificNameWithAuthor: string
  family: string | null
  /** 0부터 1 사이의 AI 유사도 */
  score: number
  rarity: RarityCode | null
  imageUrl: string | null
  imageAttribution: string | null
}

export type IdentifyResponse = {
  candidates: PlantCandidate[]
  /** Pl@ntNet 잔여 호출 수. 알 수 없으면 null입니다. */
  remainingRequests: number | null
}

/** GET /api/collection의 공식 도감 항목 */
export type CollectionPlant = {
  id: number
  koreanName: string
  scientificName: string
  rarity: RarityCode
  collected: boolean
  observationCount: number
  /** 사용자가 직접 찍은 대표 사진. 미획득이면 null이라 실루엣으로 표시합니다. */
  representativeImageUrl: string | null
}

/** 공식 도감에 없는 기타 발견. 완성률 계산에서는 제외합니다. */
export type OtherFinding = {
  scientificName: string
  displayName: string
  observationCount: number
  representativeImageUrl: string
  lastObservedAt: string
}

export type CollectionResponse = {
  summary: {
    total: number
    collected: number
    /** 0부터 100 사이의 정수 */
    completionRate: number
  }
  plants: CollectionPlant[]
  others: OtherFinding[]
}

/** iNaturalist에서 조회한 공개 식물 정보. 저장하지 않고 요청할 때마다 가져옵니다. */
export type PlantInformation = {
  id: number
  koreanName: string | null
  scientificName: string
  rank: string | null
  observationsCount: number
  summary: string | null
  wikipediaUrl: string | null
  image: {
    url: string
    attribution: string | null
    license: string | null
  } | null
}

export type PlantDetailResponse = {
  plant: {
    id: number
    official: true
    koreanName: string
    scientificName: string
    rarity: RarityCode
    /** iNaturalist에서 찾지 못하면 null입니다. */
    information: PlantInformation | null
    informationSource: 'iNaturalist'
  }
  userCollection: {
    collected: boolean
    observationCount: number
    observations: Array<{
      id: string
      imageUrl: string
      observedAt: string
    }>
  }
}
