import type { ObservationId, PlantId, PlantStage, RarityCode } from "./domain";
import type { XpEvent } from "@/lib/progress";

export type ObservationResult = "new" | "duplicate";

export type ObservationDto = {
  id: ObservationId;
  plantId: PlantId | null;
  scientificName: string;
  displayName: string;
  imagePath: string;
  observedAt: string;
  imageUrl: string;
};

export type CreateObservationResponseDto = {
  result: ObservationResult;
  observation: ObservationDto;
  reward: {
    xp: number;
    breakdown: XpEvent[];
    totalXp: number;
    level: number;
    currentLevelXp: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    plantCount: number;
  };
};

export type CreateObservationInput = {
  image: File;
  plantId?: PlantId | null;
  scientificName?: string;
  genusName?: string | null;
  displayName?: string;
  identificationScore?: number;
  identificationCandidates?: Array<{
    scientificName: string;
    genusName: string | null;
    score: number;
  }>;
};
