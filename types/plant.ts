import type {
  ObservationId,
  PlantId,
  PlantSlug,
  PlantCategory,
  PlantStage,
  RarityCode,
} from "./domain";

export interface PlantSpecies {
  slug: PlantSlug;
  koreanName: string;
  scientificName: string;
  category: PlantCategory;
  rarity: RarityCode;
  description: string;
  season?: string;
  imageUrl: string;
}

export interface CollectedPlant {
  slug: PlantSlug;
  koreanName: string;
  scientificName: string;
  category: PlantSpecies["category"];
  rarity: RarityCode;
  description: string;
  userPhotoUrl: string;
  firstFoundAt: string;
  observationCount: number;
}

export interface CollectionSummary {
  totalSpeciesFound: number;
  totalOfficialSpecies: number;
  totalObservations: number;
  completionRate: number;
}

export type CollectionPlantDto = {
  id: PlantId;
  koreanName: string;
  scientificName: string;
  stage: PlantStage;
  rarity: RarityCode;
  collected: boolean;
  observationCount: number;
  representativeImageUrl: string | null;
};

export type OtherFindingDto = {
  scientificName: string;
  displayName: string;
  observationCount: number;
  representativeImageUrl: string;
  lastObservedAt: string;
};

export type CollectionResponseDto = {
  summary: {
    total: number;
    collected: number;
    completionRate: number;
  };
  plants: CollectionPlantDto[];
  others: OtherFindingDto[];
};

export type PlantDetailResponseDto = {
  plant: {
    id: PlantId;
    official: true;
    koreanName: string;
    scientificName: string;
    stage: PlantStage;
    rarity: RarityCode;
    description: string | null;
    informationSource: "산림청 국립수목원";
    informationSourceUrl: "https://www.data.go.kr/data/15143513/openapi.do";
  };
  userCollection: {
    collected: boolean;
    observationCount: number;
    observations: Array<{
      id: ObservationId;
      imageUrl: string;
      observedAt: string;
    }>;
  };
};
