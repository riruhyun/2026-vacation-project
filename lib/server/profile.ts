import { getCollectionCards } from "@/lib/server/collection-cards";
import { imageUrl } from "@/lib/server/image";
import { supabase } from "@/lib/server/supabase";
import {
  FEATURED_PLANT_SLOTS,
  NICKNAME_MAX_LENGTH,
} from "@/lib/profile-limits";
import type { FeaturedPlantDto } from "@/types/user";

export { FEATURED_PLANT_SLOTS, NICKNAME_MAX_LENGTH };

export type ProfileRow = {
  nickname: string | null;
  xp: number;
  level: number;
  onboarded_at: string | null;
  featured_card_ids: number[] | null;
};

const PROFILE_COLUMNS = "nickname,xp,level,onboarded_at,featured_card_ids";

export async function getProfileRow(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

/**
 * 대표 식물로 고른 카드를 화면에 띄울 형태로 만듭니다.
 * 카드가 사라졌거나 아직 수집하지 않은 id는 조용히 빼기 때문에 결과가 3개보다 적을 수 있습니다.
 * 빈 자리는 화면에서 빈 이미지로 채웁니다.
 */
export async function getFeaturedPlants(
  userId: string,
  cardIds: readonly number[] | null | undefined,
): Promise<FeaturedPlantDto[]> {
  const ids = [...new Set(cardIds || [])].slice(0, FEATURED_PLANT_SLOTS);
  if (ids.length === 0) return [];

  const [cards, countResult, matchResult] = await Promise.all([
    getCollectionCards(),
    supabase
      .from("user_collection_counts")
      .select("collection_card_id,count")
      .eq("user_id", userId)
      .in("collection_card_id", ids),
    supabase
      .from("observation_collection_matches")
      .select("observation_id,collection_card_id")
      .in("collection_card_id", ids),
  ]);

  if (countResult.error) throw countResult.error;
  if (matchResult.error) throw matchResult.error;

  const counts = (countResult.data || []) as Array<{
    collection_card_id: number;
    count: number;
  }>;
  const countByCard = new Map(counts.map((row) => [row.collection_card_id, row.count]));
  const matches = (matchResult.data || []) as Array<{
    observation_id: string;
    collection_card_id: number;
  }>;

  // 매칭 테이블에는 다른 사용자의 관찰도 들어 있으므로 사진은 내 관찰에서만 가져옵니다.
  const imageByCard = new Map<number, string>();
  if (matches.length > 0) {
    const { data, error } = await supabase
      .from("observations")
      .select("id,image_path")
      .eq("user_id", userId)
      .in(
        "id",
        matches.map((match) => match.observation_id),
      )
      .order("observed_at", { ascending: false });
    if (error) throw error;

    const cardByObservation = new Map(
      matches.map((match) => [match.observation_id, match.collection_card_id]),
    );
    for (const row of (data || []) as Array<{ id: string; image_path: string }>) {
      const cardId = cardByObservation.get(row.id);
      if (cardId != null && !imageByCard.has(cardId)) {
        imageByCard.set(cardId, imageUrl(row.image_path));
      }
    }
  }

  const cardById = new Map(cards.map((card) => [card.id, card]));

  return ids.flatMap((id) => {
    const card = cardById.get(id);
    const count = countByCard.get(id) || 0;
    if (!card || count === 0) return [];

    return [
      {
        id: card.id,
        koreanName: card.displayName,
        scientificName: card.scientificName,
        stage: card.stage,
        rarity: card.rarity,
        imageUrl: imageByCard.get(id) ?? null,
        observationCount: count,
      },
    ];
  });
}

/** 대표 식물로 고를 수 있는 카드인지 확인합니다. 한 번이라도 수집한 카드만 고를 수 있습니다. */
export async function collectedCardIds(userId: string) {
  const { data, error } = await supabase
    .from("user_collection_counts")
    .select("collection_card_id")
    .eq("user_id", userId)
    .gt("count", 0);

  if (error) throw error;
  return new Set(
    ((data || []) as Array<{ collection_card_id: number }>).map(
      (row) => row.collection_card_id,
    ),
  );
}
