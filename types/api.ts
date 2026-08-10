import type { PlantCandidate, PlantPart } from "./plant";

export interface IdentifyRequest {
  image: string;
  part?: PlantPart;
}

export interface IdentifyResponse {
  candidates: PlantCandidate[];
  success: boolean;
}
