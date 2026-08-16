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

export function buildFindingDetailData(
  scientificName: string,
  collection: CollectionResponseDto,
): PlantDetailScreenData | null {
  const target = collection.otherFindings.find(
    (finding) => finding.scientificName.trim().toLowerCase() === scientificName.trim().toLowerCase(),
  );

  if (!target) return null;

  return {
    official: false as const,
    koreanName: target.displayName,
    scientificName: target.scientificName,
    description: null,
    imageUrl: target.representativeImageUrl || null,
    rarity: null,
    observationCount: target.observationCount,
    firstObservedAt: null,
    informationSource: null,
  };
}
