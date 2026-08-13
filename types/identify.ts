import type { PlantId, PlantStage, RarityCode } from "./domain";

export type IdentifyStep =
  | "confirm"
  | "analyzing"
  | "candidates"
  | "failed"
  | "result";

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
