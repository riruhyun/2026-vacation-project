import type { PlantId, PlantSlug, PlantStage, RarityCode } from "./domain";

export type MatchType = "exact" | null;

export type IdentifyCandidateDto = {
  plantId: PlantId | null;
  official: boolean;
  matchType: MatchType;
  koreanName: string;
  description: string | null;
  scientificName: string;
  scientificNameWithAuthor: string;
  family: string | null;
  score: number;
  stage: PlantStage | null;
  rarity: RarityCode | null;
  imageUrl: string | null;
  imageAttribution: string | null;
};

export type IdentifyResponseDto = {
  candidates: IdentifyCandidateDto[];
  remainingRequests: number | null;
};

export type CandidateCardViewModel = {
  id: string;
  name: string;
  confidence: number;
  description: string;
  imageUrl: string | null;
  candidate: IdentifyCandidateDto;
};

export interface NewPlantRewardViewModel {
  slug: PlantSlug;
  koreanName: string;
  scientificName: string;
  rarity: RarityCode;
  photoUrl: string;
  discoveredAt: string;
  baseXp: number;
  rarityBonusXp: number;
}

export interface DuplicateObservationViewModel {
  slug: PlantSlug;
  koreanName: string;
  photoUrl: string;
  observedAt: string;
  observationCount: number;
  rewardXp: number;
  canReplaceCoverPhoto: boolean;
}
