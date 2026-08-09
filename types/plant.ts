export type PlantPart = "auto" | "flower" | "leaf" | "fruit";

export interface PlantCandidate {
  id: string;
  name: string;
  confidence: number;
  description: string;
  imageUrl: string;
}

export interface PlantSpecies {
  id: string;
  name: string;
  scientificName?: string;
  description: string;
  imageUrl: string;
}
