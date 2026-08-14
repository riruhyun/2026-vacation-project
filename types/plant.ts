import type {
  ObservationId,
  PlantId,
  PlantStage,
  RarityCode,
} from "./domain";

export type CollectionPlantDto = {
  id: PlantId;
  koreanName: string;
  scientificName: string;
  stage: PlantStage;
  rarity: RarityCode;
  collected: boolean;
  observationCount: number;
  representativeImageUrl: string | null;
  firstObservedAt: string | null;
  lastObservedAt: string | null;
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
    totalObservations: number;
    completionRate: number;
  };
  officialPlants: CollectionPlantDto[];
  otherFindings: OtherFindingDto[];
};

export interface ForestPlantDetailDto {
  koreanName: string;
  scientificName: string;
  description: string | null;
  informationSource: "산림청 국립수목원";
  informationSourceUrl: "https://www.data.go.kr/data/15143513/openapi.do";
}

export interface PlantDetailScreenData {
  official: boolean;
  id?: PlantId;
  koreanName: string;
  scientificName: string;
  description: string;
  imageUrl: string | null;
  rarity: RarityCode | null;
  observationCount: number;
  firstObservedAt: string | null;
  informationSource: string;
  informationSourceUrl?: string;
}

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
