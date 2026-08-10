export type IdentifyResultRarity = "흔함" | "보통" | "드묾";

export interface NewPlantRewardViewModel {
  speciesId: string;
  koreanName: string;
  scientificName: string;
  rarity: IdentifyResultRarity;
  photoUrl: string;
  discoveredAt: string;
  baseXp: number;
  rarityBonusXp: number;
}

export interface DuplicateObservationViewModel {
  speciesId: string;
  koreanName: string;
  photoUrl: string;
  observedAt: string;
  observationCount: number;
  rewardXp: number;
  canReplaceCoverPhoto: boolean;
}
