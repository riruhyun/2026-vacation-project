export type PlantId = number;
export type ObservationId = string;
export type PlantStage = 1 | 2 | 3;

export type RarityCode = "common" | "uncommon" | "rare";
export type RarityLabel = "흔함" | "보통" | "드묾";
export const PLANT_ORGANS = ["auto", "flower", "leaf", "fruit"] as const;
export type PlantOrgan = (typeof PLANT_ORGANS)[number];

export const RARITY_LABEL = {
  common: "흔함",
  uncommon: "보통",
  rare: "드묾",
} satisfies Record<RarityCode, RarityLabel>;
