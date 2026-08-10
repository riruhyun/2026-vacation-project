export type Rarity = "흔함" | "보통" | "드묾";
export type PlantCategory = "꽃" | "풀" | "나무";
export type PlantPart = "auto" | "flower" | "leaf" | "fruit";

export interface PlantSpecies {
  id: string;
  koreanName: string;
  scientificName: string;
  category: PlantCategory;
  rarity: Rarity;
  description: string;
  season?: string;
  imageUrl: string;
}

export interface CollectedPlant {
  speciesId: string;
  koreanName: string;
  scientificName: string;
  category: PlantCategory;
  rarity: Rarity;
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

export interface UserProgress {
  nickname: string;
  level: number;
  levelTitle: string;
  currentXp: number;
  xpToNextLevel: number;
}

export interface PlantCandidate {
  id: string;
  name: string;
  confidence: number;
  description: string;
  imageUrl: string;
}
