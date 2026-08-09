import type { PlantPart } from "./plant";

export interface ObservationDraft {
  imageDataUrl: string;
  part: PlantPart;
  capturedAt: string;
}
