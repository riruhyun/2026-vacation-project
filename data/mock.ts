import { getOfficialPlantById } from "@/data/plants";
import type { PlantOrgan } from "@/types/domain";
import type { IdentifyCandidateDto, IdentifyResponseDto } from "@/types/identify";
import type { ObservationDto, ObservationResult } from "@/types/observation";
import type { ForestPlantDetailDto } from "@/types/plant";
import type { ProfileResponse } from "@/types/user";

const informationSource = "산림청 국립수목원" as const;
const informationSourceUrl =
  "https://www.data.go.kr/data/15143513/openapi.do" as const;

export const MOCK_OBSERVATIONS: readonly ObservationDto[] = [
  {
    id: "observation-plantago-1",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "mock/plantago-1.jpg",
    imageUrl: "/plants/example1.jpg",
    observedAt: "2026-08-01T09:30:00.000Z",
  },
  {
    id: "observation-plantago-2",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "mock/plantago-2.jpg",
    imageUrl: "/plants/example2.webp",
    observedAt: "2026-08-07T14:10:00.000Z",
  },
  {
    id: "observation-erigeron-1",
    plantId: 3,
    scientificName: "Erigeron annuus",
    displayName: "개망초",
    imagePath: "mock/erigeron-1.jpg",
    imageUrl: "/plants/example3.jpg",
    observedAt: "2026-08-04T11:20:00.000Z",
  },
  {
    id: "observation-setaria-1",
    plantId: 4,
    scientificName: "Setaria viridis",
    displayName: "강아지풀",
    imagePath: "mock/setaria-1.jpg",
    imageUrl: "/plants/example1.jpg",
    observedAt: "2026-08-05T16:40:00.000Z",
  },
  {
    id: "observation-bellis-1",
    plantId: null,
    scientificName: "Bellis perennis",
    displayName: "데이지",
    imagePath: "mock/bellis-1.jpg",
    imageUrl: "/plants/example2.webp",
    observedAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "observation-bellis-2",
    plantId: null,
    scientificName: "Bellis perennis",
    displayName: "데이지",
    imagePath: "mock/bellis-2.jpg",
    imageUrl: "/plants/example3.jpg",
    observedAt: "2026-08-06T08:45:00.000Z",
  },
];

export const MOCK_PROFILE: ProfileResponse = {
  profile: {
    nickname: "식물 탐험가",
    xp: 220,
    level: 1,
    currentLevelXp: 220,
    xpToNextLevel: 400,
  },
  stats: {
    totalObservations: MOCK_OBSERVATIONS.length,
    officialPlants: 3,
    otherPlants: 1,
    completionRate: 6,
    lastObservedAt: "2026-08-07T14:10:00.000Z",
  },
};

function forestDetail(
  koreanName: string,
  scientificName: string,
  description: string,
): ForestPlantDetailDto {
  return {
    koreanName,
    scientificName,
    description,
    informationSource,
    informationSourceUrl,
  };
}

export const MOCK_FOREST_DETAILS: Readonly<Record<string, ForestPlantDetailDto>> = {
  "Plantago asiatica": forestDetail(
    "질경이",
    "Plantago asiatica",
    "길가와 풀밭에서 흔히 자라는 여러해살이풀입니다.",
  ),
  "Erigeron annuus": forestDetail(
    "개망초",
    "Erigeron annuus",
    "여름부터 가을까지 작은 흰 꽃을 피우는 국화과 식물입니다.",
  ),
  "Setaria viridis": forestDetail(
    "강아지풀",
    "Setaria viridis",
    "부드러운 이삭이 특징인 한해살이 벼과 식물입니다.",
  ),
  "Bellis perennis": forestDetail(
    "데이지",
    "Bellis perennis",
    "흰 꽃잎과 노란 중심부가 특징인 국화과 식물입니다.",
  ),
};

function officialCandidate(plantId: number, score: number): IdentifyCandidateDto {
  const plant = getOfficialPlantById(plantId);
  if (!plant) throw new Error(`Unknown mock official plant: ${plantId}`);

  return {
    plantId: plant.id,
    official: true,
    matchType: plant.id === 14 ? "genus" : "species",
    koreanName: plant.koreanName,
    description: MOCK_FOREST_DETAILS[plant.scientificName]?.description ?? null,
    scientificName: plant.scientificName,
    scientificNameWithAuthor: plant.scientificName,
    genusName: plant.scientificName.split(/\s+/)[0] || null,
    family: null,
    score,
    stage: plant.stage,
    rarity: plant.rarity,
    imageUrl: "/plants/example1.jpg",
    imageAttribution: null,
  };
}

const bellisCandidate: IdentifyCandidateDto = {
  plantId: null,
  official: false,
  matchType: null,
  koreanName: "데이지",
  description: MOCK_FOREST_DETAILS["Bellis perennis"].description,
  scientificName: "Bellis perennis",
  scientificNameWithAuthor: "Bellis perennis L.",
  genusName: "Bellis",
  family: "Asteraceae",
  score: 0.48,
  stage: null,
  rarity: null,
  imageUrl: "/plants/example3.jpg",
  imageAttribution: null,
};

export const MOCK_IDENTIFY_RESPONSES: Readonly<
  Record<PlantOrgan, IdentifyResponseDto>
> = {
  auto: {
    candidates: [officialCandidate(3, 0.88), officialCandidate(1, 0.62), bellisCandidate],
    remainingRequests: 99,
  },
  flower: {
    candidates: [officialCandidate(3, 0.92), bellisCandidate, officialCandidate(17, 0.46)],
    remainingRequests: 99,
  },
  leaf: {
    candidates: [officialCandidate(1, 0.9), officialCandidate(4, 0.57), bellisCandidate],
    remainingRequests: 99,
  },
  fruit: {
    candidates: [officialCandidate(4, 0.86), officialCandidate(1, 0.51), bellisCandidate],
    remainingRequests: 99,
  },
};

export const MOCK_OBSERVATION_TEMPLATES: Readonly<
  Record<ObservationResult, ObservationDto>
> = {
  new: {
    id: "mock-new-observation",
    plantId: 2,
    scientificName: "Oxalis corniculata",
    displayName: "괭이밥",
    imagePath: "mock/new-observation.jpg",
    imageUrl: "/plants/example1.jpg",
    observedAt: "2026-08-13T09:00:00.000Z",
  },
  duplicate: {
    id: "mock-duplicate-observation",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "mock/duplicate-observation.jpg",
    imageUrl: "/plants/example2.webp",
    observedAt: "2026-08-13T09:00:00.000Z",
  },
};
