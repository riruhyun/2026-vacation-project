import "server-only";

import { getCollectionCardById, getCollectionCards } from "@/lib/server/collection-cards";
import { currentUserId } from "@/lib/server/current-user";
import { getForestPlant, getForestPlantByNumber } from "@/lib/server/forest";
import { imageUrl } from "@/lib/server/image";
import { getFeaturedPlants, getProfileRow } from "@/lib/server/profile";
import { supabase } from "@/lib/server/supabase";
import { levelProgress, levelTitle } from "@/lib/progress";
import type { CollectionResponseDto, PlantDetailScreenData } from "@/types/plant";
import type {
  ActivityLogDto,
  HomeData,
  ProfileEditorData,
  ProfilePageData,
} from "@/types/user";

type ObservationRow = {
  id: string;
  scientific_name: string;
  display_name: string;
  image_path: string;
  observed_at: string;
};

type MatchRow = {
  observation_id: string;
  collection_card_id: number | null;
};

type CountRow = {
  collection_card_id: number;
  count: number;
};

type ActivityRow = {
  id: string;
  type: "new_plant" | "level_up" | "level_3";
  scientific_name: string | null;
  display_name: string | null;
  level: number | null;
  created_at: string;
};

const SOURCE = "산림청 국가생물종지식정보시스템";
const NO_DESCRIPTION = "등록된 식물 설명이 없습니다.";

async function observationsFor(userId: string | null) {
  if (!userId) return { observations: [] as ObservationRow[], matches: [] as MatchRow[] };

  const { data, error } = await supabase
    .from("observations")
    .select("id,scientific_name,display_name,image_path,observed_at")
    .eq("user_id", userId)
    .order("observed_at", { ascending: false });
  if (error) throw error;

  const observations = (data || []) as ObservationRow[];
  if (observations.length === 0) return { observations, matches: [] as MatchRow[] };

  const matchResult = await supabase
    .from("observation_collection_matches")
    .select("observation_id,collection_card_id")
    .in("observation_id", observations.map((item) => item.id));
  if (matchResult.error) throw matchResult.error;

  return {
    observations,
    matches: (matchResult.data || []) as MatchRow[],
  };
}

export async function getLiveCollectionData(
  requestedUserId?: string | null,
): Promise<CollectionResponseDto> {
  const userId = requestedUserId === undefined ? await currentUserId() : requestedUserId;
  const [cards, observationData, countResult] = await Promise.all([
    getCollectionCards(),
    observationsFor(userId),
    userId
      ? supabase
          .from("user_collection_counts")
          .select("collection_card_id,count")
          .eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (countResult.error) throw countResult.error;

  const counts = (countResult.data || []) as CountRow[];
  const countByCard = new Map(counts.map((item) => [item.collection_card_id, item.count]));
  const matchByObservation = new Map(
    observationData.matches.map((item) => [item.observation_id, item.collection_card_id]),
  );
  const observationsByCard = new Map<number, ObservationRow[]>();
  const otherGroups = new Map<string, ObservationRow[]>();

  for (const observation of observationData.observations) {
    const cardId = matchByObservation.get(observation.id);
    if (cardId != null) {
      const group = observationsByCard.get(cardId) || [];
      group.push(observation);
      observationsByCard.set(cardId, group);
    } else {
      const key = observation.scientific_name.toLowerCase();
      const group = otherGroups.get(key) || [];
      group.push(observation);
      otherGroups.set(key, group);
    }
  }

  const officialPlants = cards.map((card) => {
    const observations = observationsByCard.get(card.id) || [];
    const count = countByCard.get(card.id) || 0;
    const latest = observations[0];
    const first = observations[observations.length - 1];

    return {
      id: card.id,
      koreanName: card.displayName,
      scientificName: card.scientificName,
      stage: card.stage,
      rarity: card.rarity,
      collected: count > 0,
      observationCount: count,
      representativeImageUrl: latest ? imageUrl(latest.image_path) : null,
      firstObservedAt: first?.observed_at || null,
      lastObservedAt: latest?.observed_at || null,
    };
  });

  const otherFindings = [...otherGroups.values()].map((group) => ({
    scientificName: group[0].scientific_name,
    displayName: group[0].display_name,
    observationCount: group.length,
    representativeImageUrl: imageUrl(group[0].image_path),
    lastObservedAt: group[0].observed_at,
  }));
  const collected = officialPlants.filter((plant) => plant.collected).length;

  return {
    summary: {
      total: cards.length,
      collected,
      totalObservations: observationData.observations.length,
      completionRate: cards.length ? Math.round((collected / cards.length) * 100) : 0,
    },
    officialPlants,
    otherFindings,
  };
}

async function profileData(userId: string | null, collection: CollectionResponseDto) {
  const [profileRow, activityResult] = await Promise.all([
    userId ? getProfileRow(userId) : Promise.resolve(null),
    userId
      ? supabase
          .from("activity_logs")
          .select("id,type,scientific_name,display_name,level,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (activityResult.error && activityResult.error.code !== "PGRST205") {
    throw activityResult.error;
  }

  const xp = profileRow?.xp || 0;
  const progress = levelProgress(xp);
  const featuredPlants = userId
    ? await getFeaturedPlants(userId, profileRow?.featured_card_ids)
    : [];
  const recentActivities = ((activityResult.data || []) as ActivityRow[]).map(
    (activity): ActivityLogDto => ({
      id: activity.id,
      type: activity.type === "level_3" ? "level_up" : activity.type,
      scientificName: activity.scientific_name,
      displayName: activity.display_name,
      level: activity.level,
      levelTitle: activity.level ? levelTitle(activity.level) : null,
      createdAt: activity.created_at,
    }),
  );
  const lastObservedAt = [
    ...collection.officialPlants.map((plant) => plant.lastObservedAt),
    ...collection.otherFindings.map((plant) => plant.lastObservedAt),
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) || null;

  return {
    profile: {
      nickname: profileRow?.nickname || null,
      xp,
      // profiles.level은 DB 함수가 예전 곡선으로 채웁니다. 누적 XP에서 다시 셉니다.
      level: progress.level,
      currentLevelXp: progress.currentXp,
      xpToNextLevel: progress.xpToNextLevel,
      onboarded: Boolean(profileRow?.onboarded_at),
    },
    featuredPlants,
    stats: {
      totalObservations: collection.summary.totalObservations,
      officialPlants: collection.summary.collected,
      totalOfficialPlants: collection.summary.total,
      otherPlants: collection.otherFindings.length,
      completionRate: collection.summary.completionRate,
      lastObservedAt,
    },
    recentActivities,
  };
}

/** 온보딩과 프로필 편집 화면이 쓰는 값입니다. 로그인하지 않았으면 null입니다. */
export async function getProfileEditorData(): Promise<ProfileEditorData | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const [profileRow, collection] = await Promise.all([
    getProfileRow(userId),
    getLiveCollectionData(userId),
  ]);

  return {
    nickname: profileRow?.nickname || "",
    featuredPlantIds: profileRow?.featured_card_ids || [],
    onboarded: Boolean(profileRow?.onboarded_at),
    collectedPlants: collection.officialPlants.filter((plant) => plant.collected),
  };
}

export async function getLiveProfileData(): Promise<ProfilePageData> {
  const userId = await currentUserId();
  const collection = await getLiveCollectionData(userId);
  const data = await profileData(userId, collection);
  return {
    ...data,
    levelTitle: levelTitle(data.profile.level),
    // Keep the existing profile screen safe until it migrates to recentActivities.
    recentObservations: [],
  };
}

export async function getLiveHomeData(): Promise<HomeData> {
  const userId = await currentUserId();
  const collection = await getLiveCollectionData(userId);
  const data = await profileData(userId, collection);
  const recentPlants = [
    ...collection.officialPlants.filter((plant) => plant.collected),
    ...collection.otherFindings,
  ].sort((left, right) =>
    (right.lastObservedAt || "").localeCompare(left.lastObservedAt || ""),
  );

  return {
    profile: data.profile,
    levelTitle: levelTitle(data.profile.level),
    totalObservations: collection.summary.totalObservations,
    completionRate: collection.summary.completionRate,
    recentPlants,
  };
}

export async function searchLivePlants(query: string) {
  const normalized = query.trim().toLowerCase();
  const { officialPlants } = await getLiveCollectionData();
  if (!normalized) return officialPlants;
  return officialPlants.filter(
    (plant) =>
      plant.koreanName.toLowerCase().includes(normalized) ||
      plant.scientificName.toLowerCase().includes(normalized),
  );
}

async function forestDetail(
  scientificName: string,
  representativePlantPilbkNo?: string | null,
) {
  try {
    return representativePlantPilbkNo
      ? await getForestPlantByNumber(representativePlantPilbkNo)
      : await getForestPlant(scientificName);
  } catch {
    return null;
  }
}

export async function getLivePlantDetail(id: number): Promise<PlantDetailScreenData | null> {
  const userId = await currentUserId();
  const [card, observationData] = await Promise.all([
    getCollectionCardById(id),
    observationsFor(userId),
  ]);
  if (!card) return null;

  const matchedIds = new Set(
    observationData.matches
      .filter((match) => match.collection_card_id === card.id)
      .map((match) => match.observation_id),
  );
  const observations = observationData.observations.filter((item) => matchedIds.has(item.id));
  if (observations.length === 0) return null;

  const detail = await forestDetail(card.scientificName, card.representativePlantPilbkNo);
  return {
    official: true,
    id: card.id,
    koreanName: detail?.koreanName || card.displayName,
    scientificName: card.scientificName,
    description: detail?.description || NO_DESCRIPTION,
    imageUrl: imageUrl(observations[0].image_path),
    rarity: card.rarity,
    observationCount: observations.length,
    firstObservedAt: observations.at(-1)?.observed_at || "",
    informationSource: SOURCE,
  };
}

export async function getLiveFindingDetail(
  scientificName: string,
): Promise<PlantDetailScreenData | null> {
  const observationData = await observationsFor(await currentUserId());
  const matchByObservation = new Map(
    observationData.matches.map((match) => [match.observation_id, match.collection_card_id]),
  );
  const observations = observationData.observations.filter(
    (item) =>
      matchByObservation.get(item.id) == null &&
      item.scientific_name.toLowerCase() === scientificName.trim().toLowerCase(),
  );
  if (observations.length === 0) return null;

  const detail = await forestDetail(observations[0].scientific_name);
  return {
    official: false,
    koreanName: detail?.koreanName || observations[0].display_name,
    scientificName: observations[0].scientific_name,
    description: detail?.description || NO_DESCRIPTION,
    imageUrl: imageUrl(observations[0].image_path),
    rarity: null,
    observationCount: observations.length,
    firstObservedAt: observations.at(-1)?.observed_at || "",
    informationSource: SOURCE,
  };
}
