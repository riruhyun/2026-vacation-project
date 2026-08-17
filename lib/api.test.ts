import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  identifyPlant,
  saveObservation,
  updateProfile,
} from "@/lib/api";

const IDENTIFY_RESPONSE = {
  candidates: [],
  remainingRequests: 499,
};

const OBSERVATION_RESPONSE = {
  result: "new" as const,
  observation: {
    id: "00000000-0000-4000-8000-000000000001",
    plantId: 1,
    scientificName: "Plantago asiatica",
    displayName: "질경이",
    imagePath: "user/image.jpg",
    imageUrl: "https://example.supabase.co/observations/user/image.jpg",
    observedAt: "2026-08-14T00:00:00.000Z",
  },
  reward: {
    xp: 100,
    breakdown: [
      { type: "observation", label: "관찰", xp: 10 },
      { type: "first_discovery", label: "첫 발견", xp: 90 },
      { type: "rarity_common", label: "흔함 희귀도", xp: 0 },
    ],
    totalXp: 100,
    level: 2,
    currentLevelXp: 0,
    xpToNextLevel: 150,
    leveledUp: true,
    plantCount: 1,
  },
};

function success(data: unknown, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("identifyPlant", () => {
  it("forwards the caller's abort signal with the identify request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(IDENTIFY_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await identifyPlant(
      new Blob(["image"], { type: "image/jpeg" }),
      "leaf",
      controller.signal,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });

  it("sends the image and selected organ as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(IDENTIFY_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    await identifyPlant(
      new Blob(["image"], { type: "image/jpeg" }),
      "leaf",
    );

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(path).toMatch(/\/api\/identify$/);
    expect(init.method).toBe("POST");
    expect((form.get("image") as File).type).toBe("image/jpeg");
    expect(form.get("organ")).toBe("leaf");
  });

  it("omits organ when automatic detection is selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(IDENTIFY_RESPONSE));
    vi.stubGlobal("fetch", fetchMock);

    await identifyPlant(new Blob(["image"], { type: "image/png" }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.body as FormData).has("organ")).toBe(false);
  });
});

describe("saveObservation", () => {
  it("forwards the caller's abort signal with the observation request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(OBSERVATION_RESPONSE, 201));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await saveObservation(
      {
        image: new File(["image"], "plant.jpg", { type: "image/jpeg" }),
        plantId: 1,
      },
      controller.signal,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });

  it("sends the collection card id while preserving the identified taxon", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(OBSERVATION_RESPONSE, 201));
    vi.stubGlobal("fetch", fetchMock);
    const image = new File(["image"], "plant.jpg", { type: "image/jpeg" });

    await saveObservation({
      image,
      plantId: 1,
      scientificName: "Plantago asiatica",
      genusName: "Plantago",
      displayName: "질경이",
      identificationScore: 0.91,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get("plantId")).toBe("1");
    expect(form.get("scientificName")).toBe("Plantago asiatica");
    expect(form.get("genusName")).toBe("Plantago");
    expect(form.get("displayName")).toBe("질경이");
    expect(form.get("identificationScore")).toBe("0.91");
  });

  it("sends scientificName and displayName for an unofficial candidate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(OBSERVATION_RESPONSE, 201));
    vi.stubGlobal("fetch", fetchMock);
    const image = new File(["image"], "plant.png", { type: "image/png" });

    await saveObservation({
      image,
      plantId: null,
      scientificName: "Taraxacum officinale",
      displayName: "Common dandelion",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.has("plantId")).toBe(false);
    expect(form.get("scientificName")).toBe("Taraxacum officinale");
    expect(form.get("displayName")).toBe("Common dandelion");
  });
});

describe("updateProfile", () => {
  it("sends a nickname as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      success({ profile: { nickname: "새 탐험가", avatarUrl: null } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateProfile({ nickname: "새 탐험가" });

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(path).toMatch(/\/api\/profile$/);
    expect(init.method).toBe("PATCH");
    expect(form.get("nickname")).toBe("새 탐험가");
    expect(form.has("avatar")).toBe(false);
  });

  it("sends an avatar without an unchanged nickname", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      success({ profile: { nickname: "탐험가", avatarUrl: "https://example.com/avatar.jpg" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const avatar = new File(["image"], "avatar.jpg", { type: "image/jpeg" });

    await updateProfile({ avatar });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.has("nickname")).toBe(false);
    expect(form.get("avatar")).toBe(avatar);
  });
});

describe("ApiError", () => {
  it.each([
    [401, "isUnauthorized"],
    [422, "isNotIdentified"],
  ] as const)("preserves HTTP %i", async (status, getter) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { message: "request failed", details: "internal" },
          }),
          { status, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    try {
      await identifyPlant(new Blob(["image"], { type: "image/jpeg" }));
      throw new Error("expected identifyPlant to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(status);
      expect((error as ApiError)[getter]).toBe(true);
      expect((error as ApiError).message).toBe("request failed");
    }
  });
});
