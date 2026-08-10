import type { ObservationDraft } from "@/types/observation";
import type { PlantPart } from "@/types/plant";

const STORAGE_KEY = "plant-identify-draft";

export function saveDraft(imageDataUrl: string, part: PlantPart = "auto") {
  const draft: ObservationDraft = {
    imageDataUrl,
    part,
    capturedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function getDraft(): ObservationDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ObservationDraft;
  } catch {
    return null;
  }
}

export function updateDraftPart(part: PlantPart) {
  const draft = getDraft();
  if (!draft) return;
  saveDraft(draft.imageDataUrl, part);
}

export function clearDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}
