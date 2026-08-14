import type {
  CollectionResponseDto,
  PlantDetailResponseDto,
  PlantDetailScreenData,
} from "@/types/plant";
import type { ObservationDto } from "@/types/observation";
import type { HomeData, ProfilePageData, ProfileResponse } from "@/types/user";

const DEFAULT_DESCRIPTION = "도감 설명을 준비하고 있습니다.";

function getLevelTitle(level: number) {
  if (level >= 5) return "숲 지킴이";
  if (level >= 3) return "숲 탐험가";
  return "새싹 관찰자";
}

function sortByObservedAtDescending<T extends { observedAt?: string | null }>(items: readonly T[]) {
  return [...items].sort((left, right) => {
    const leftObservedAt = left.observedAt ?? "";
    const rightObservedAt = right.observedAt ?? "";
    return rightObservedAt.localeCompare(leftObservedAt);
  });
}

function toRecentObservations(collection: CollectionResponseDto): ObservationDto[] {
  const officialPlants = collection.officialPlants
    .filter((plant) => plant.lastObservedAt)
    .map((plant) => ({
      id: `official-${plant.id}`,
      plantId: plant.id,
      scientificName: plant.scientificName,
      displayName: plant.koreanName,
      imagePath: "",
      observedAt: plant.lastObservedAt ?? "",
      imageUrl: plant.representativeImageUrl ?? "",
    }));

  const otherFindings = collection.otherFindings
    .filter((finding) => finding.lastObservedAt)
    .map((finding) => ({
      id: `finding-${finding.scientificName}`,
      plantId: null,
      scientificName: finding.scientificName,
      displayName: finding.displayName,
      imagePath: "",
      observedAt: finding.lastObservedAt,
      imageUrl: finding.representativeImageUrl,
    }));

  return sortByObservedAtDescending([...officialPlants, ...otherFindings]).slice(0, 3);
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
  collection: CollectionResponseDto,
): ProfilePageData {
  return {
    profile: profileResponse.profile,
    stats: profileResponse.stats,
    levelTitle: getLevelTitle(profileResponse.profile.level),
    recentObservations: toRecentObservations(collection),
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
    description: response.plant.description ?? DEFAULT_DESCRIPTION,
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
    description: DEFAULT_DESCRIPTION,
    imageUrl: target.representativeImageUrl || null,
    rarity: null,
    observationCount: target.observationCount,
    firstObservedAt: null,
    informationSource: "산림청 국립수목원",
  };
}
