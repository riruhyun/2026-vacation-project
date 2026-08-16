import { PLANT_ORGANS, type PlantOrgan } from "@/types/domain";
import type { XpEvent } from "@/lib/progress";
import type {
  IdentifyCandidateDto,
  IdentifyResponseDto,
} from "@/types/identify";
import type {
  CreateObservationResponseDto,
  ObservationDto,
} from "@/types/observation";

const IDENTIFY_KEYS = {
  draftImage: "identify:draft-image",
  organ: "identify:organ",
  candidates: "identify:candidates",
  result: "identify:result",
} as const;

export type IdentifyDraft = {
  imageUrl: string;
  organ: PlantOrgan;
};

type StoredIdentifyResult = Omit<CreateObservationResponseDto, "observation"> & {
  observation: Omit<ObservationDto, "imageUrl"> & {
    imageUrl?: string;
  };
};

function getStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function readJson(key: string): unknown | null {
  const storage = getStorage();
  if (!storage) return null;

  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

function isPlantOrgan(value: unknown): value is PlantOrgan {
  return (
    typeof value === "string" &&
    PLANT_ORGANS.some((organ) => organ === value)
  );
}

function isIdentifyCandidate(value: unknown): value is IdentifyCandidateDto {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    (typeof candidate.plantId === "number" || candidate.plantId === null) &&
    typeof candidate.official === "boolean" &&
    (["species", "genus"].includes(candidate.matchType as string) ||
      candidate.matchType === null) &&
    typeof candidate.koreanName === "string" &&
    (typeof candidate.description === "string" || candidate.description === null) &&
    typeof candidate.scientificName === "string" &&
    typeof candidate.scientificNameWithAuthor === "string" &&
    (typeof candidate.genusName === "string" || candidate.genusName === null) &&
    (typeof candidate.family === "string" || candidate.family === null) &&
    typeof candidate.score === "number" &&
    ([1, 2, 3].includes(candidate.stage as number) || candidate.stage === null) &&
    (["common", "uncommon", "rare"].includes(candidate.rarity as string) ||
      candidate.rarity === null) &&
    (typeof candidate.imageUrl === "string" || candidate.imageUrl === null) &&
    (typeof candidate.imageAttribution === "string" ||
      candidate.imageAttribution === null)
  );
}

function isIdentifyResponse(value: unknown): value is IdentifyResponseDto {
  if (!value || typeof value !== "object") return false;

  const response = value as Record<string, unknown>;
  return (
    Array.isArray(response.candidates) &&
    response.candidates.every(isIdentifyCandidate) &&
    (typeof response.remainingRequests === "number" ||
      response.remainingRequests === null)
  );
}

function isXpEvent(value: unknown): value is XpEvent {
  if (!value || typeof value !== "object") return false;

  const event = value as Record<string, unknown>;
  return (
    typeof event.type === "string" &&
    typeof event.label === "string" &&
    typeof event.xp === "number"
  );
}

function isObservationResult(value: unknown): value is StoredIdentifyResult {
  if (!value || typeof value !== "object") return false;

  const response = value as Record<string, unknown>;
  const observation = response.observation as Record<string, unknown> | undefined;
  const reward = response.reward as Record<string, unknown> | undefined;

  if (!observation || !reward) return false;

  return (
    (response.result === "new" || response.result === "duplicate") &&
    typeof observation.id === "string" &&
    (typeof observation.plantId === "number" || observation.plantId === null) &&
    typeof observation.scientificName === "string" &&
    typeof observation.displayName === "string" &&
    typeof observation.imagePath === "string" &&
    typeof observation.observedAt === "string" &&
    (!("imageUrl" in observation) || typeof observation.imageUrl === "string") &&
    typeof reward.xp === "number" &&
    Array.isArray(reward.breakdown) &&
    reward.breakdown.every(isXpEvent) &&
    typeof reward.totalXp === "number" &&
    typeof reward.level === "number" &&
    typeof reward.currentLevelXp === "number" &&
    typeof reward.xpToNextLevel === "number" &&
    typeof reward.leveledUp === "boolean" &&
    typeof reward.plantCount === "number"
  );
}

export function readIdentifyDraft(): IdentifyDraft | null {
  const imageUrl = readJson(IDENTIFY_KEYS.draftImage);
  const organ = readJson(IDENTIFY_KEYS.organ);

  if (typeof imageUrl === "string" && isPlantOrgan(organ)) {
    return { imageUrl, organ };
  }

  const storage = getStorage();
  storage?.removeItem(IDENTIFY_KEYS.draftImage);
  storage?.removeItem(IDENTIFY_KEYS.organ);
  return null;
}

export function writeIdentifyDraft(imageUrl: string, organ: PlantOrgan = "auto") {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(IDENTIFY_KEYS.draftImage, JSON.stringify(imageUrl));
    storage.setItem(IDENTIFY_KEYS.organ, JSON.stringify(organ));
    return true;
  } catch {
    storage.removeItem(IDENTIFY_KEYS.draftImage);
    storage.removeItem(IDENTIFY_KEYS.organ);
    return false;
  }
}

export function readIdentifyCandidates(): IdentifyResponseDto | null {
  const value = readJson(IDENTIFY_KEYS.candidates);
  if (isIdentifyResponse(value)) return value;

  if (value !== null) getStorage()?.removeItem(IDENTIFY_KEYS.candidates);
  return null;
}

export function writeIdentifyCandidates(response: IdentifyResponseDto) {
  getStorage()?.setItem(IDENTIFY_KEYS.candidates, JSON.stringify(response));
}

export function readIdentifyResult(): CreateObservationResponseDto | null {
  const value = readJson(IDENTIFY_KEYS.result);
  const draft = readIdentifyDraft();
  if (isObservationResult(value) && draft) {
    return {
      ...value,
      observation: {
        ...value.observation,
        imageUrl: value.observation.imageUrl ?? draft.imageUrl,
      },
    };
  }

  if (value !== null) getStorage()?.removeItem(IDENTIFY_KEYS.result);
  return null;
}

export function writeIdentifyResult(result: CreateObservationResponseDto) {
  const storage = getStorage();
  if (!storage) return false;

  const observation: StoredIdentifyResult["observation"] = {
    id: result.observation.id,
    plantId: result.observation.plantId,
    scientificName: result.observation.scientificName,
    displayName: result.observation.displayName,
    imagePath: result.observation.imagePath,
    observedAt: result.observation.observedAt,
  };

  if (/^https?:\/\//i.test(result.observation.imageUrl)) {
    observation.imageUrl = result.observation.imageUrl;
  }

  const storedResult: StoredIdentifyResult = { ...result, observation };

  try {
    storage.setItem(IDENTIFY_KEYS.result, JSON.stringify(storedResult));
    return true;
  } catch {
    storage.removeItem(IDENTIFY_KEYS.result);
    return false;
  }
}

export function clearIdentifySession() {
  const storage = getStorage();
  if (!storage) return;

  Object.values(IDENTIFY_KEYS).forEach((key) => storage.removeItem(key));
}
