import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readIdentifyResult,
  writeIdentifyDraft,
  writeIdentifyResult,
} from "@/lib/identify-storage";
import type { CreateObservationResponseDto } from "@/types/observation";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const IMAGE_URL = "data:image/jpeg;base64,current-draft";

const RESULT: CreateObservationResponseDto = {
  result: "new",
  observation: {
    id: "mock-observation",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "mock/current.jpg",
    imageUrl: IMAGE_URL,
    observedAt: "2026-08-13T12:00:00.000Z",
  },
  reward: {
    xp: 50,
    totalXp: 290,
    level: 1,
    leveledUp: false,
    plantCount: 1,
  },
};

function useStorage(storage: Storage) {
  vi.stubGlobal("window", { sessionStorage: storage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("identify result storage", () => {
  it("stores result metadata without duplicating the draft image", () => {
    const storage = new MemoryStorage();
    useStorage(storage);

    expect(writeIdentifyDraft(IMAGE_URL)).toBe(true);
    expect(writeIdentifyResult(RESULT)).toBe(true);

    const stored = storage.getItem("identify:result");
    expect(stored).not.toContain(IMAGE_URL);
    expect(JSON.parse(stored ?? "null").observation).not.toHaveProperty("imageUrl");
  });

  it("hydrates a stored result with the current draft image", () => {
    const storage = new MemoryStorage();
    useStorage(storage);

    writeIdentifyDraft(IMAGE_URL);
    const storedObservation = {
      id: RESULT.observation.id,
      plantId: RESULT.observation.plantId,
      scientificName: RESULT.observation.scientificName,
      displayName: RESULT.observation.displayName,
      imagePath: RESULT.observation.imagePath,
      observedAt: RESULT.observation.observedAt,
    };
    storage.setItem(
      "identify:result",
      JSON.stringify({ ...RESULT, observation: storedObservation }),
    );

    expect(readIdentifyResult()?.observation.imageUrl).toBe(IMAGE_URL);
  });

  it("reports a result storage quota failure without throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem("identify:draft-image", JSON.stringify(IMAGE_URL));
    storage.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
    useStorage(storage);

    expect(writeIdentifyResult(RESULT)).toBe(false);
    expect(storage.getItem("identify:draft-image")).toBe(JSON.stringify(IMAGE_URL));
  });
});
