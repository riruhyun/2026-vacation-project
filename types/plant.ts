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