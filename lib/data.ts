import {
  MOCK_FOREST_DETAILS,
  MOCK_IDENTIFY_RESPONSES,
  MOCK_OBSERVATION_TEMPLATES,
  MOCK_OBSERVATIONS,
  MOCK_PROFILE,
} from "@/data/mock";
import {
  getOfficialPlant,
  getOfficialPlantById,
  OFFICIAL_PLANTS,
} from "@/data/plants";
import type { PlantOrgan } from "@/types/domain";
import type { IdentifyResponseDto } from "@/types/identify";
import type {
  CreateObservationResponseDto,
  ObservationDto,
  ObservationSelection,
} from "@/types/observation";
import type {
  CollectionPlantDto,
  CollectionResponseDto,
  ForestPlantDetailDto,
  OtherFindingDto,
  PlantDetailScreenData,
} from "@/types/plant";
import type { HomeData, ProfilePageData } from "@/types/user";
import { levelProgress, observationXp } from "@/lib/progress";

const DEFAULT_DESCRIPTION = "도감 설명을 준비하고 있습니다.";
const DEFAULT_INFORMATION_SOURCE = "산림청 국립수목원";

type ObservationGroup = {
  scientificName: string;
  observations: ObservationDto[];
};

function groupObservationsByScientificName(): Map<string, ObservationGroup> {
  const groups = new Map<string, ObservationGroup>();

  for (const observation of MOCK_OBSERVATIONS) {
    const key = observation.scientificName.toLowerCase();
    const group = groups.get(key);

    if (group) {
      group.observations.push(observation);
      continue;
    }

    groups.set(key, {
      scientificName: observation.scientificName,
      observations: [observation],
    });
  }

  return groups;
}

function sortByObservedAtDescending(observations: readonly ObservationDto[]) {
  return [...observations].sort((left, right) =>
    right.observedAt.localeCompare(left.observedAt),
  );
}

function getRepresentativeObservation(observations: readonly ObservationDto[]) {
  return sortByObservedAtDescending(observations)[0] ?? null;
}

function getFirstObservation(observations: readonly ObservationDto[]) {
  return [...observations].sort((left, right) =>
    left.observedAt.localeCompare(right.observedAt),
  )[0] ?? null;
}

function getLevelTitle(level: number) {
  if (level >= 5) return "숲 지킴이";
  if (level >= 3) return "숲 탐험가";
  return "새싹 관찰자";
}

function getForestDetail(scientificName: string): ForestPlantDetailDto | null {
  const key = Object.keys(MOCK_FOREST_DETAILS).find(
    (name) => name.toLowerCase() === scientificName.toLowerCase(),
  );

  return key ? MOCK_FOREST_DETAILS[key] : null;
}

function toOfficialPlant(
  plant: (typeof OFFICIAL_PLANTS)[number],
  observations: readonly ObservationDto[],
): CollectionPlantDto {
  const latest = getRepresentativeObservation(observations);
  const first = getFirstObservation(observations);

  return {
    id: plant.id,
    koreanName: plant.koreanName,
    scientificName: plant.scientificName,
    stage: plant.stage,
    rarity: plant.rarity,
    collected: observations.length > 0,
    observationCount: observations.length,
    representativeImageUrl: latest?.imageUrl ?? null,
    firstObservedAt: first?.observedAt ?? null,
    lastObservedAt: latest?.observedAt ?? null,
  };
}

function toOtherFinding(group: ObservationGroup): OtherFindingDto {
  const latest = getRepresentativeObservation(group.observations);

  return {
    scientificName: group.scientificName,
    displayName: latest?.displayName ?? group.scientificName,
    observationCount: group.observations.length,
    representativeImageUrl: latest?.imageUrl ?? "",
    lastObservedAt: latest?.observedAt ?? "",
  };
}

export async function getCollectionData(): Promise<CollectionResponseDto> {
  const groups = groupObservationsByScientificName();
  const officialPlants = OFFICIAL_PLANTS.map((plant) =>
    toOfficialPlant(
      plant,
      groups.get(plant.scientificName.toLowerCase())?.observations ?? [],
    ),
  );
  const otherFindings = [...groups.values()]
    .filter((group) => !getOfficialPlant(group.scientificName))
    .map(toOtherFinding)
    .sort((left, right) => right.lastObservedAt.localeCompare(left.lastObservedAt));
  const collected = officialPlants.filter((plant) => plant.collected).length;

  return {
    summary: {
      total: OFFICIAL_PLANTS.length,
      collected,
      totalObservations: MOCK_OBSERVATIONS.length,
      completionRate: Math.round((collected / OFFICIAL_PLANTS.length) * 100),
    },
    officialPlants,
    otherFindings,
  };
}

export async function getHomeData(): Promise<HomeData> {
  const collection = await getCollectionData();
  const recentPlants = [
    ...collection.officialPlants.filter((plant) => plant.collected),
    ...collection.otherFindings,
  ].sort((left, right) => {
    const leftObservedAt = left.lastObservedAt ?? "";
    const rightObservedAt = right.lastObservedAt ?? "";
    return rightObservedAt.localeCompare(leftObservedAt);
  });

  return {
    profile: { ...MOCK_PROFILE.profile },
    levelTitle: getLevelTitle(MOCK_PROFILE.profile.level),
    totalObservations: collection.summary.totalObservations,
    completionRate: collection.summary.completionRate,
    recentPlants,
  };
}

export async function getProfileData(): Promise<ProfilePageData> {
  const collection = await getCollectionData();
  const recentObservations = sortByObservedAtDescending(MOCK_OBSERVATIONS).map(
    (observation) => ({ ...observation }),
  );

  return {
    profile: { ...MOCK_PROFILE.profile },
    stats: {
      totalObservations: collection.summary.totalObservations,
      officialPlants: collection.summary.collected,
      otherPlants: collection.otherFindings.length,
      completionRate: collection.summary.completionRate,
      lastObservedAt: recentObservations[0]?.observedAt ?? null,
    },
    levelTitle: getLevelTitle(MOCK_PROFILE.profile.level),
    recentObservations,
  };
}

export async function getPlantDetail(
  id: number,
): Promise<PlantDetailScreenData | null> {
  const plant = getOfficialPlantById(id);
  if (!plant) return null;

  const groups = groupObservationsByScientificName();
  const observations = groups.get(plant.scientificName.toLowerCase())?.observations ?? [];
  if (observations.length === 0) return null;

  const latest = getRepresentativeObservation(observations);
  const first = getFirstObservation(observations);
  const detail = getForestDetail(plant.scientificName);

  return {
    official: true,
    id: plant.id,
    koreanName: detail?.koreanName ?? plant.koreanName,
    scientificName: plant.scientificName,
    description: detail?.description ?? DEFAULT_DESCRIPTION,
    imageUrl: latest?.imageUrl ?? null,
    rarity: plant.rarity,
    observationCount: observations.length,
    firstObservedAt: first?.observedAt ?? "",
    informationSource: detail?.informationSource ?? DEFAULT_INFORMATION_SOURCE,
  };
}

export async function getFindingDetail(
  scientificName: string,
): Promise<PlantDetailScreenData | null> {
  if (getOfficialPlant(scientificName)) return null;

  const groups = groupObservationsByScientificName();
  const group = groups.get(scientificName.trim().toLowerCase());
  if (!group) return null;

  const latest = getRepresentativeObservation(group.observations);
  const first = getFirstObservation(group.observations);
  const detail = getForestDetail(group.scientificName);

  return {
    official: false,
    koreanName: detail?.koreanName ?? latest?.displayName ?? group.scientificName,
    scientificName: group.scientificName,
    description: detail?.description ?? DEFAULT_DESCRIPTION,
    imageUrl: latest?.imageUrl ?? null,
    rarity: null,
    observationCount: group.observations.length,
    firstObservedAt: first?.observedAt ?? "",
    informationSource: detail?.informationSource ?? DEFAULT_INFORMATION_SOURCE,
  };
}

export async function searchPlants(query: string): Promise<CollectionPlantDto[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const { officialPlants } = await getCollectionData();

  if (!normalizedQuery) return officialPlants;

  return officialPlants.filter(
    (plant) =>
      plant.koreanName.toLowerCase().includes(normalizedQuery) ||
      plant.scientificName.toLowerCase().includes(normalizedQuery),
  );
}

export async function getMockIdentifyResult(
  organ: PlantOrgan,
): Promise<IdentifyResponseDto> {
  const response = MOCK_IDENTIFY_RESPONSES[organ];

  return {
    remainingRequests: response.remainingRequests,
    candidates: response.candidates.map((candidate) => ({ ...candidate })),
  };
}

export async function getMockObservationResult(
  selection: ObservationSelection,
): Promise<CreateObservationResponseDto> {
  const groups = groupObservationsByScientificName();
  const previousCount =
    groups.get(selection.scientificName.toLowerCase())?.observations.length ?? 0;
  const result = previousCount > 0 ? "duplicate" : "new";
  const observation = MOCK_OBSERVATION_TEMPLATES[result];
  const xp = observationXp(selection.official ? selection.stage : null, previousCount);
  const totalXp = MOCK_PROFILE.profile.xp + xp;
  const progress = levelProgress(totalXp);

  return {
    result,
    observation: {
      ...observation,
      plantId: selection.official ? selection.plantId : null,
      scientificName: selection.scientificName,
      displayName: selection.koreanName,
    },
    reward: {
      xp,
      totalXp,
      level: progress.level,
      leveledUp: progress.level > MOCK_PROFILE.profile.level,
      plantCount: previousCount + 1,
    },
  };
}
