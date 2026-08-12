import type {
  ObservationId,
  PlantId,
  PlantPart,
} from "./domain";

export interface ObservationDraft {
  imageDataUrl: string;
  part: PlantPart;
  capturedAt: string;
}

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
