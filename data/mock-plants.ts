import type { PlantCandidate } from "@/types/plant";
import { PLANT_SPECIES } from "./plant-species";

export const MOCK_CANDIDATES: PlantCandidate[] = [
  {
    id: PLANT_SPECIES[0].id,
    name: PLANT_SPECIES[0].name,
    confidence: 87,
    description: PLANT_SPECIES[0].description,
    imageUrl: PLANT_SPECIES[0].imageUrl,
  },
  {
    id: PLANT_SPECIES[1].id,
    name: PLANT_SPECIES[1].name,
    confidence: 64,
    description: PLANT_SPECIES[1].description,
    imageUrl: PLANT_SPECIES[1].imageUrl,
  },
  {
    id: PLANT_SPECIES[2].id,
    name: PLANT_SPECIES[2].name,
    confidence: 46,
    description: PLANT_SPECIES[2].description,
    imageUrl: PLANT_SPECIES[2].imageUrl,
  },
];
