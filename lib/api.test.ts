import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  identifyPlant,
  saveObservation,
  setUserId,
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
    xp: 50,
    totalXp: 50,
    level: 1,
    leveledUp: false,
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
  setUserId(null);
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
    expect(path).toBe("/api/identify");
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

  it("sends only plantId for an official candidate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success(OBSERVATION_RESPONSE, 201));
    vi.stubGlobal("fetch", fetchMock);
    const image = new File(["image"], "plant.jpg", { type: "image/jpeg" });

    await saveObservation({
      image,
      plantId: 1,
      scientificName: "ignored",
      displayName: "ignored",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get("plantId")).toBe("1");
    expect(form.has("scientificName")).toBe(false);
    expect(form.has("displayName")).toBe(false);
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
