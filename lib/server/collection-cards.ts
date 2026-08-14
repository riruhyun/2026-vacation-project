import { supabase } from "@/lib/server/supabase";
import type {
  CollectionCard,
} from "@/lib/collection-card-matching";
import type { PlantStage, RarityCode } from "@/types/domain";

type CollectionCardRow = {
  id: number;
  display_name: string;
  scientific_name: string;
  stage: PlantStage;
  rarity: RarityCode;
  representative_plant_pilbk_no: string | null;
  genus_name: string | null;
  genus_korean_name: string | null;
};

type CollectionCardMatcherRow = {
  collection_card_id: number;
  taxon_rank: "species" | "genus";
  normalized_taxon_name: string;
};

function toCollectionCard(row: CollectionCardRow): CollectionCard {
  return {
    id: row.id,
    displayName: row.display_name,
    scientificName: row.scientific_name,
    stage: row.stage,
    rarity: row.rarity,
    representativePlantPilbkNo: row.representative_plant_pilbk_no,
    genusName: row.genus_name,
    genusKoreanName: row.genus_korean_name,
  };
}

export async function getCollectionCards() {
  const { data, error } = await supabase
    .from("collection_cards")
    .select(
      "id,display_name,scientific_name,stage,rarity,representative_plant_pilbk_no,genus_name,genus_korean_name",
    )
    .eq("is_active", true)
    .order("id");

  if (error) throw error;
  return ((data || []) as CollectionCardRow[]).map(toCollectionCard);
}

export async function getCollectionCardById(id: number) {
  const { data, error } = await supabase
    .from("collection_cards")
    .select(
      "id,display_name,scientific_name,stage,rarity,representative_plant_pilbk_no,genus_name,genus_korean_name",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ? toCollectionCard(data as CollectionCardRow) : null;
}

export async function getCollectionCatalog() {
  const [cards, matcherResult] = await Promise.all([
    getCollectionCards(),
    supabase
      .from("collection_card_matchers")
      .select("collection_card_id,taxon_rank,normalized_taxon_name"),
  ]);

  if (matcherResult.error) throw matcherResult.error;
  const matchers = ((matcherResult.data || []) as CollectionCardMatcherRow[]).map(
    (row) => ({
      collectionCardId: row.collection_card_id,
      taxonRank: row.taxon_rank,
      normalizedTaxonName: row.normalized_taxon_name,
    }),
  );

  return { cards, matchers };
}
