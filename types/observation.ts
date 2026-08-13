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
    totalXp: number;
    level: number;
    leveledUp: boolean;
    plantCount: number;
  };
};

export type CreateObservationInput = {
  image: File;
  plantId?: PlantId | null;
  scientificName?: string;
  displayName?: string;
};
