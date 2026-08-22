import type {
  CollectionResponseDto,
  PlantDetailResponseDto,
  PlantDetailScreenData,
} from "@/types/plant";
import type { HomeData, ProfilePageData, ProfileResponse } from "@/types/user";
import type { ActivitiesResponseDto } from "@/types/activity";

function getLevelTitle(level: number) {
  if (level >= 5) return "숲 지킴이";
  if (level >= 3) return "숲 탐험가";
  return "새싹 관찰자";
}

export function buildHomeData(
  profileResponse: ProfileResponse,
  collection: CollectionResponseDto,
): HomeData {
  const recentPlants = [
    ...collection.officialPlants.filter((plant) => plant.collected),
    ...collection.otherFindings,
  ].sort((left, right) => {
    const leftObservedAt = left.lastObservedAt ?? "";
    const rightObservedAt = right.lastObservedAt ?? "";
    return rightObservedAt.localeCompare(leftObservedAt);
  });

  return {
    profile: profileResponse.profile,
    levelTitle: getLevelTitle(profileResponse.profile.level),
    totalObservations: collection.summary.totalObservations,
    completionRate: collection.summary.completionRate,
    recentPlants,
  };
}

export function buildProfilePageData(
  profileResponse: ProfileResponse,
  activitiesResponse: ActivitiesResponseDto,
): ProfilePageData {
  return {
    profile: profileResponse.profile,
    stats: profileResponse.stats,
    levelTitle: getLevelTitle(profileResponse.profile.level),
    recentActivities: activitiesResponse.activities,
  };
}

export function buildPlantDetailData(response: PlantDetailResponseDto): PlantDetailScreenData {
  const observations = response.userCollection.observations;
  const latestObservation = observations[0] ?? null;
  const firstObservation = observations[observations.length - 1] ?? null;

  return {
    official: true as const,
    id: response.plant.id,
    koreanName: response.plant.koreanName,
    scientificName: response.plant.scientificName,
    description: response.plant.description,
    imageUrl: latestObservation?.imageUrl ?? null,
    rarity: response.plant.rarity,
    observationCount: response.userCollection.observationCount,
    firstObservedAt: firstObservation?.observedAt ?? null,
    informationSource: response.plant.informationSource,
    informationSourceUrl: response.plant.informationSourceUrl,
  };
}

// 산림청 조회 결과 중 화면에 쓰는 값만 받음 - 조회 실패시 null 반환
export type ForestPlantLookup = {
  koreanName: string | null;
  description: string | null;
};

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// 산림청에 자료가 있으면 도감의 공식 식물과 똑같이 한국 이름과 설명을 보여주지만, 자료가 없다면 식물 이름만 남고 설명은 보여주지 않음.
export function buildFindingDetailData(
  scientificName: string,
  collection: CollectionResponseDto,
  forestPlant?: ForestPlantLookup | null,
): PlantDetailScreenData | null {
  const target = collection.otherFindings.find(
    (finding) => finding.scientificName.trim().toLowerCase() === scientificName.trim().toLowerCase(),
  );

  if (!target) return null;

  const description = trimmedOrNull(forestPlant?.description);

  return {
    official: false as const,
    // 산림청 이름을 먼저 사용. 단, 없을시 관찰할 때 저장해 둔 이름을 그대로 사용.
    koreanName: trimmedOrNull(forestPlant?.koreanName) || target.displayName,
    scientificName: target.scientificName,
    description,
    imageUrl: target.representativeImageUrl || null,
    rarity: null,
    observationCount: target.observationCount,
    firstObservedAt: null,
    // 설명이 있을 때만 출처를 붙임
    ...(description
      ? {
          informationSource: "산림청 국립수목원",
          informationSourceUrl: "https://www.data.go.kr/data/15143513/openapi.do",
        }
      : { informationSource: null }),
  };
}
