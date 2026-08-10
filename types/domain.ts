export type PlantId = number;
export type ObservationId = string;
export type PlantSlug = string;

export type RarityCode = "common" | "uncommon" | "rare";
export type RarityLabel = "흔함" | "보통" | "드묾";
export type PlantCategory = "꽃" | "풀" | "나무";
export type PlantPart = "auto" | "flower" | "leaf" | "fruit";

export const RARITY_LABEL = {
  common: "흔함",
  uncommon: "보통",
  rare: "드묾",
} satisfies Record<RarityCode, RarityLabel>;
