import type {
  ObservationId,
  PlantId,
  PlantSlug,
  PlantCategory,
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

export type PlantInformationDto = {
  id: number;
  koreanName: string | null;
  scientificName: string;
  rank: string | null;
  observationsCount: number;
  summary: string | null;
  wikipediaUrl: string | null;
  image: {
    url: string;
    attribution: string | null;
    license: string | null;
  } | null;
};

export type PlantDetailResponseDto = {
  plant: {
    id: PlantId;
    official: true;
    koreanName: string;
    scientificName: string;
    rarity: RarityCode;
    information: PlantInformationDto | null;
    informationSource: "iNaturalist";
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
