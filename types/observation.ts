import type { XpReason } from "@/lib/progress";
import type { ObservationId, PlantId, PlantStage } from "./domain";

export type ObservationResult = "new" | "duplicate";

export type ObservationSelection = {
  plantId: PlantId | null;
  official: boolean;
  koreanName: string;
  scientificName: string;
  stage: PlantStage | null;
};

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
    /** 왜 이만큼 받았는지 보여주는 항목입니다. 보상이 없으면 빈 배열입니다. */
    breakdown: XpReason[];
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
