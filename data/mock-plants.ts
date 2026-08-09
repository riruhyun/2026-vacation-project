// 실제 API/DB 연동 전까지 화면 구현에 사용 예정
// Supabase 연동 완료 후 실제 조회 로직으로 대체될 예정

import type {
    PlantSpecies,
    CollectedPlant,
    CollectionSummary,
    UserProgress,
} from "@/types/plant";

// 공식 도감 식물 데이터
export const mockPlantSpecies: PlantSpecies[] = [
    {
        id: "sancheoljjuk",
        koreanName: "산철쭉",
        scientificName: "Rhododendron yedoense",
        category: "꽃",
        rarity: "보통",
        description: "봄에 연분홍빛 꽃이 피며, 잎 가장자리와 뒷면에 잔털이 있는 편이에요.",
        season: "봄 · 연분홍 꽃",
        imageUrl: "/plants/sancheoljjuk.png",
    },
    {
        id: "cheoljjuk",
        koreanName: "철쭉",
        scientificName: "Rhododendron schlippenbachii",
        category: "꽃",
        rarity: "보통",
        description: "산철쭉보다 잎이 넓고 둥근 편이며, 봄에 연한 꽃이 핍니다.",
        season: "봄 · 넓은 잎",
        imageUrl: "/plants/cheoljjuk.png",
    },
    {
        id: "yeongsanhong",
        koreanName: "영산홍",
        scientificName: "Rhododendron indicum",
        category: "꽃",
        rarity: "흔함",
        description: "조경용으로 흔히 심는 진분홍 꽃나무로, 잎이 작고 촘촘해요.",
        season: "봄 · 작은 잎",
        imageUrl: "/plants/yeongsanhong.png",
    },
    {
        id: "mindeulle",
        koreanName: "민들레",
        scientificName: "Taraxacum",
        category: "꽃",
        rarity: "흔함",
        description: "노란 꽃이 피고 나면 하얀 솜털 씨앗이 바람에 날아가요.",
        season: "봄~가을",
        imageUrl: "/plants/mindeulle.png",
    },
    {
        id: "tokkipul",
        koreanName: "토끼풀",
        scientificName: "Trifolium repens",
        category: "풀",
        rarity: "흔함",
        description: "세 갈래 잎이 특징이며, 드물게 네 잎을 찾을 수 있어요.",
        season: "봄~여름",
        imageUrl: "/plants/tokkipul.png",
    },
    {
        id: "eunhaengnamu",
        koreanName: "은행나무",
        scientificName: "Ginkgo biloba",
        category: "나무",
        rarity: "흔함",
        description: "부채 모양 잎이 특징이며, 가을에 노랗게 물듭니다.",
        season: "가을 · 노란 단풍",
        imageUrl: "/plants/eunhaengnamu.png",
    },
    {
        id: "gaemangcho",
        koreanName: "개망초",
        scientificName: "Erigeron annuus",
        category: "꽃",
        rarity: "보통",
        description: "작은 하얀 꽃이 계란 프라이처럼 노란 중심을 가지고 있어요.",
        season: "여름",
        imageUrl: "/plants/gaemangcho.png",
    },
    {
        id: "ganggajipul",
        koreanName: "강아지풀",
        scientificName: "Setaria viridis",
        category: "풀",
        rarity: "흔함",
        description: "강아지 꼬리처럼 복슬복슬한 이삭이 바람에 흔들려요.",
        season: "여름~가을",
        imageUrl: "/plants/ganggajipul.png",
    },
];

// 사용자가 실제로 수집한 카드 목록 (도감 화면용)
export const mockCollectedPlants: CollectedPlant[] = [
    {
        speciesId: "sancheoljjuk",
        koreanName: "산철쭉",
        scientificName: "Rhododendron yedoense",
        category: "꽃",
        rarity: "보통",
        description:
            "봄에 연분홍빛 꽃이 피며, 잎 가장자리와 뒷면에 잔털이 있는 편이에요.",
        userPhotoUrl: "/plants/user/sancheoljjuk-user.png",
        firstFoundAt: "2026-08-03",
        observationCount: 1,
    },
    {
        speciesId: "mindeulle",
        koreanName: "민들레",
        scientificName: "Taraxacum",
        category: "꽃",
        rarity: "흔함",
        description: "노란 꽃이 피고 나면 하얀 솜털 씨앗이 바람에 날아가요.",
        userPhotoUrl: "/plants/user/mindeulle-user.png",
        firstFoundAt: "2026-08-02",
        observationCount: 3,
    },
    {
        speciesId: "tokkipul",
        koreanName: "토끼풀",
        scientificName: "Trifolium repens",
        category: "풀",
        rarity: "흔함",
        description: "세 갈래 잎이 특징이며, 드물게 네 잎을 찾을 수 있어요.",
        userPhotoUrl: "/plants/user/tokkipul-user.png",
        firstFoundAt: "2026-08-02",
        observationCount: 2,
    },
    {
        speciesId: "eunhaengnamu",
        koreanName: "은행나무",
        scientificName: "Ginkgo biloba",
        category: "나무",
        rarity: "흔함",
        description: "부채 모양 잎이 특징이며, 가을에 노랗게 물듭니다.",
        userPhotoUrl: "/plants/user/eunhaengnamu-user.png",
        firstFoundAt: "2026-08-03",
        observationCount: 2,
    },
    {
        speciesId: "gaemangcho",
        koreanName: "개망초",
        scientificName: "Erigeron annuus",
        category: "꽃",
        rarity: "보통",
        description: "작은 하얀 꽃이 계란 프라이처럼 노란 중심을 가지고 있어요.",
        userPhotoUrl: "/plants/user/gaemangcho-user.png",
        firstFoundAt: "2026-08-03",
        observationCount: 1,
    },
    {
        speciesId: "ganggajipul",
        koreanName: "강아지풀",
        scientificName: "Setaria viridis",
        category: "풀",
        rarity: "흔함",
        description: "강아지 꼬리처럼 복슬복슬한 이삭이 바람에 흔들려요.",
        userPhotoUrl: "/plants/user/ganggajipul-user.png",
        firstFoundAt: "2026-08-03",
        observationCount: 2,
    },
];

// 도감 완성률 등 요약 정보 (홈, 도감 상단용)
export const mockCollectionSummary: CollectionSummary = {
    totalSpeciesFound: 7,
    totalOfficialSpecies: 40,
    totalObservations: 12,
    completionRate: Math.round((7 / 40) * 100),
};

// 사용자 레벨/경험치 더미 데이터
export const mockUserProgress: UserProgress = {
    nickname: "홍길동",
    level: 3,
    levelTitle: "새싹 관찰자",
    currentXp: 220,
    xpToNextLevel: 180,
};

// id로 공식 도감 식물 하나 조회 (임시 버전)
export function getMockPlantSpeciesById(id: string): PlantSpecies | undefined {
    return mockPlantSpecies.find((p) => p.id === id);
}

// id로 수집한 카드 하나 조회 (임시 버전)
export function getMockCollectedPlantBySpeciesId(
    id: string
): CollectedPlant | undefined {
    return mockCollectedPlants.find((p) => p.speciesId === id);
}

// 이름/학명/특징 텍스트로 공식 도감 검색 (임시 버전)
export function searchMockPlantSpecies(query: string): PlantSpecies[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mockPlantSpecies.filter(
        (p) =>
            p.koreanName.toLowerCase().includes(q) ||
            p.scientificName.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
    );
}