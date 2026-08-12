// 실제 API/DB 연동 전까지 화면 구현에 사용되는 mock 데이터
// plant-species.ts를 원본 카탈로그로 두고, 이 파일은 화면용 파생 데이터를 담당한다.

import { PLANT_SPECIES } from "./plant-species";
import type {
  CollectionSummary,
  CollectedPlant,
  PlantSpecies,
} from "../types/plant";
import type { UserProgress } from "../types/user";
import type { IdentifyCandidateDto } from "../types/identify";

export const mockPlantSpecies = PLANT_SPECIES;

export const mockCollectedPlants: CollectedPlant[] = [
  {
    slug: "sancheoljjuk",
    koreanName: "산철쭉",
    scientificName: "Rhododendron yedoense",
    category: "꽃",
    rarity: "uncommon",
    description:
      "봄에 연분홍빛 꽃이 피며, 잎 가장자리와 뒷면에 잔털이 있는 편이에요.",
    userPhotoUrl: "/plants/user/sancheoljjuk-user.png",
    firstFoundAt: "2026-08-03",
    observationCount: 1,
  },
  {
    slug: "mindeulle",
    koreanName: "민들레",
    scientificName: "Taraxacum",
    category: "꽃",
    rarity: "common",
    description: "노란 꽃이 피고 나면 하얀 솜털 씨앗이 바람에 날아가요.",
    userPhotoUrl: "/plants/user/mindeulle-user.png",
    firstFoundAt: "2026-08-02",
    observationCount: 3,
  },
  {
    slug: "tokkipul",
    koreanName: "토끼풀",
    scientificName: "Trifolium repens",
    category: "풀",
    rarity: "common",
    description: "세 갈래 잎이 특징이며, 드물게 네 잎을 찾을 수 있어요.",
    userPhotoUrl: "/plants/user/tokkipul-user.png",
    firstFoundAt: "2026-08-02",
    observationCount: 2,
  },
  {
    slug: "eunhaengnamu",
    koreanName: "은행나무",
    scientificName: "Ginkgo biloba",
    category: "나무",
    rarity: "common",
    description: "부채 모양 잎이 특징이며, 가을에 노랗게 물듭니다.",
    userPhotoUrl: "/plants/user/eunhaengnamu-user.png",
    firstFoundAt: "2026-08-03",
    observationCount: 2,
  },
  {
    slug: "gaemangcho",
    koreanName: "개망초",
    scientificName: "Erigeron annuus",
    category: "꽃",
    rarity: "uncommon",
    description: "작은 하얀 꽃이 계란 프라이처럼 노란 중심을 가지고 있어요.",
    userPhotoUrl: "/plants/user/gaemangcho-user.png",
    firstFoundAt: "2026-08-03",
    observationCount: 1,
  },
  {
    slug: "ganggajipul",
    koreanName: "강아지풀",
    scientificName: "Setaria viridis",
    category: "풀",
    rarity: "common",
    description: "강아지 꼬리처럼 복슬복슬한 이삭이 바람에 흔들려요.",
    userPhotoUrl: "/plants/user/ganggajipul-user.png",
    firstFoundAt: "2026-08-03",
    observationCount: 2,
  },
];

export const mockCollectionSummary: CollectionSummary = {
  totalSpeciesFound: 7,
  totalOfficialSpecies: 40,
  totalObservations: 12,
  completionRate: Math.round((7 / 40) * 100),
};

export const mockUserProgress: UserProgress = {
  nickname: "홍길동",
  level: 3,
  levelTitle: "새싹 관찰자",
  currentXp: 220,
  xpToNextLevel: 180,
};

export function getMockPlantSpeciesById(slug: string): PlantSpecies | undefined {
  return PLANT_SPECIES.find((plant) => plant.slug === slug);
}

export function getMockCollectedPlantBySpeciesId(
  slug: string
): CollectedPlant | undefined {
  return mockCollectedPlants.find((plant) => plant.slug === slug);
}

export function searchMockPlantSpecies(query: string): PlantSpecies[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return PLANT_SPECIES.filter(
    (p) =>
      p.koreanName.toLowerCase().includes(q) ||
      p.scientificName.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

const candidateConfidences = [87, 64, 46];

export const MOCK_CANDIDATES: IdentifyCandidateDto[] = PLANT_SPECIES.slice(0, 3).map(
  (species, index) => ({
    plantId: null,
    official: false,
    matchType: null,
    koreanName: species.koreanName,
    description: species.description,
    scientificName: species.scientificName,
    scientificNameWithAuthor: species.scientificName,
    family: null,
    score: (candidateConfidences[index] ?? 40) / 100,
    stage: null,
    rarity: species.rarity,
    imageUrl: species.imageUrl,
    imageAttribution: null,
  })
);
