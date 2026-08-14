import type { PlantStage, RarityCode } from "@/types/domain";

export type CollectionCard = {
  id: number;
  displayName: string;
  scientificName: string;
  stage: PlantStage;
  rarity: RarityCode;
  representativePlantPilbkNo: string | null;
  genusName: string | null;
  genusKoreanName: string | null;
};

export type CollectionCardMatcher = {
  collectionCardId: number;
  taxonRank: "species" | "genus";
  normalizedTaxonName: string;
};

function normalizeTaxonName(value: string) {
  return value.trim().toLowerCase();
}

export function matchCollectionCard(
  cards: CollectionCard[],
  matchers: CollectionCardMatcher[],
  scientificName: string,
  genusName: string | null,
) {
  const normalizedSpecies = normalizeTaxonName(scientificName);
  const normalizedGenus = genusName ? normalizeTaxonName(genusName) : null;
  const matcher =
    matchers.find(
      (item) =>
        item.taxonRank === "species" &&
        item.normalizedTaxonName === normalizedSpecies,
    ) ||
    matchers.find(
      (item) =>
        item.taxonRank === "genus" &&
        item.normalizedTaxonName === normalizedGenus,
    );

  if (!matcher) return null;
  const card = cards.find((item) => item.id === matcher.collectionCardId);
  return card ? { card, matchType: matcher.taxonRank } : null;
}
