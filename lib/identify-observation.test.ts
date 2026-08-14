import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveObservationResult } from "@/lib/identify-observation";
import type { IdentifyCandidateDto } from "@/types/identify";
import type { CreateObservationResponseDto } from "@/types/observation";

const CANDIDATE: IdentifyCandidateDto = {
  plantId: 1,
  official: true,
  matchType: "exact",
  koreanName: "질경이",
  description: null,
  scientificName: "Plantago asiatica",
  scientificNameWithAuthor: "Plantago asiatica L.",
  family: "Plantaginaceae",
  score: 0.9,
  stage: 1,
  rarity: "common",
  imageUrl: null,
  imageAttribution: null,
};

const SAVED_RESULT: CreateObservationResponseDto = {
  result: "new",
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveObservationResult", () => {
  it("reuses a successful server response instead of posting another observation", async () => {
    const fetchMock = vi.fn(() => {
      throw new Error("fetch must not run for a saved result");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveObservationResult(
      SAVED_RESULT,
      CANDIDATE,
      "data:image/jpeg;base64,draft",
    );

    expect(result).toBe(SAVED_RESULT);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates one observation when there is no saved server response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("image", {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: SAVED_RESULT }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveObservationResult(
      null,
      CANDIDATE,
      "data:image/jpeg;base64,draft",
    );

    expect(result).toEqual(SAVED_RESULT);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/observations");
  });

  it("does not start the observation POST when the attempt aborts during image loading", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(() => {
      if (fetchMock.mock.calls.length === 1) {
        controller.abort();
        return Promise.resolve(
          new Response("image", {
            status: 200,
            headers: { "content-type": "image/jpeg" },
          }),
        );
      }
      throw new Error("observation POST must not start");
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveObservationResult(
        null,
        CANDIDATE,
        "data:image/jpeg;base64,draft",
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
