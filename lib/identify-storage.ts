import { isCandidateCardViewModel } from "@/lib/identify-candidate";
import type { PlantPart } from "@/types/domain";
import type { CandidateCardViewModel } from "@/types/identify";
import type { ObservationDraft } from "@/types/observation";

const DRAFT_STORAGE_KEY = "plant-identify-draft";
const RESULT_STORAGE_KEY = "plant-identify-results";
const PLANT_PARTS: PlantPart[] = ["auto", "flower", "leaf", "fruit"];

export function parseObservationDraft(value: unknown): ObservationDraft | null {
  if (!value || typeof value !== "object") return null;

  const draft = value as Record<string, unknown>;
  if (
    typeof draft.imageDataUrl !== "string" ||
    typeof draft.part !== "string" ||
    !PLANT_PARTS.includes(draft.part as PlantPart) ||
    typeof draft.capturedAt !== "string"
  ) {
    return null;
  }

  return {
    imageDataUrl: draft.imageDataUrl,
    part: draft.part as PlantPart,
    capturedAt: draft.capturedAt,
  };
}

export function parseIdentifyResults(
  value: unknown,
): CandidateCardViewModel[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.every(isCandidateCardViewModel) ? value : null;
}

export function saveDraft(imageDataUrl: string, part: PlantPart = "auto") {
  const draft: ObservationDraft = {
    imageDataUrl,
    part,
    capturedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function getDraft(): ObservationDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const draft = parseObservationDraft(JSON.parse(raw) as unknown);
    if (!draft) sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return draft;
  } catch {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

export function updateDraftPart(part: PlantPart) {
  const draft = getDraft();
  if (!draft) return;
  saveDraft(draft.imageDataUrl, part);
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function saveIdentifyResults(results: CandidateCardViewModel[]) {
  sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(results));
}

export function getIdentifyResults(): CandidateCardViewModel[] | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const results = parseIdentifyResults(JSON.parse(raw) as unknown);
    if (!results) sessionStorage.removeItem(RESULT_STORAGE_KEY);
    return results;
  } catch {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
    return null;
  }
}

export function clearIdentifyResults() {
  sessionStorage.removeItem(RESULT_STORAGE_KEY);
}
