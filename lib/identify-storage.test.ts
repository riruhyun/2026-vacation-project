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

const DRAFT_IMAGE_URL = "data:image/jpeg;base64,current-draft";
const STORED_IMAGE_URL =
  "https://example.supabase.co/storage/v1/object/public/observations/current.jpg";

const RESULT: CreateObservationResponseDto = {
  result: "new",
  observation: {
    id: "mock-observation",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "mock/current.jpg",
    imageUrl: STORED_IMAGE_URL,
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
  it("preserves the canonical backend observation image URL", () => {
    const storage = new MemoryStorage();
    useStorage(storage);

    expect(writeIdentifyDraft(DRAFT_IMAGE_URL)).toBe(true);
    expect(writeIdentifyResult(RESULT)).toBe(true);

    expect(readIdentifyResult()?.observation.imageUrl).toBe(STORED_IMAGE_URL);
  });

  it("omits a duplicated data URL and falls back to the draft image", () => {
    const storage = new MemoryStorage();
    useStorage(storage);

    writeIdentifyDraft(DRAFT_IMAGE_URL);
    const dataResult = {
      ...RESULT,
      observation: {
        ...RESULT.observation,
        imageUrl: DRAFT_IMAGE_URL,
      },
    };
    expect(writeIdentifyResult(dataResult)).toBe(true);

    const stored = storage.getItem("identify:result") ?? "";
    expect(stored).not.toContain(DRAFT_IMAGE_URL);
    expect(readIdentifyResult()?.observation.imageUrl).toBe(DRAFT_IMAGE_URL);
  });

  it.each(["blob:https://example.test/image", "DATA:image/jpeg;base64,copy"])(
    "falls back to the draft for a non-HTTP result image URL: %s",
    (imageUrl) => {
      const storage = new MemoryStorage();
      useStorage(storage);
      writeIdentifyDraft(DRAFT_IMAGE_URL);

      expect(
        writeIdentifyResult({
          ...RESULT,
          observation: { ...RESULT.observation, imageUrl },
        }),
      ).toBe(true);

      expect(readIdentifyResult()?.observation.imageUrl).toBe(DRAFT_IMAGE_URL);
    },
  );

  it("reports a result storage quota failure without throwing", () => {
    const storage = new MemoryStorage();
    storage.setItem("identify:draft-image", JSON.stringify(DRAFT_IMAGE_URL));
    storage.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
    useStorage(storage);

    expect(writeIdentifyResult(RESULT)).toBe(false);
    expect(storage.getItem("identify:draft-image")).toBe(
      JSON.stringify(DRAFT_IMAGE_URL),
    );
  });
});
