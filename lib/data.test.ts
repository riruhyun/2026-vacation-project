import { describe, expect, it } from "vitest";
import { OFFICIAL_PLANTS } from "@/data/plants";
import { captureImageError } from "@/lib/data-url";
import {
  getCollectionData,
  getFindingDetail,
  getHomeData,
  getMockIdentifyResult,
  getMockObservationResult,
  getPlantDetail,
  getProfileData,
  searchPlants,
} from "@/lib/data";

describe("OFFICIAL_PLANTS", () => {
  it("contains 50 plants with unique ids and scientific names", () => {
    expect(OFFICIAL_PLANTS).toHaveLength(50);
    expect(new Set(OFFICIAL_PLANTS.map(({ id }) => id)).size).toBe(50);
    expect(
      new Set(OFFICIAL_PLANTS.map(({ scientificName }) => scientificName)).size,
    ).toBe(50);
  });

  it("is ordered by id", () => {
    expect(OFFICIAL_PLANTS.map(({ id }) => id)).toEqual(
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
  });
});

describe("capture image validation", () => {
  it("accepts JPG and PNG images up to 6MB", () => {
    expect(captureImageError({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toBeNull();
    expect(captureImageError({ type: "image/png", size: 1 })).toBeNull();
  });

  it("rejects unsupported image types and oversized files", () => {
    expect(captureImageError({ type: "image/webp", size: 1 })).toContain("JPG");
    expect(captureImageError({ type: "image/jpeg", size: 6 * 1024 * 1024 + 1 })).toContain("6MB");
  });
});

describe("mock data access", () => {
  it("derives one consistent observation total", async () => {
    const [home, collection, profile] = await Promise.all([
      getHomeData(),
      getCollectionData(),
      getProfileData(),
    ]);

    expect(home.totalObservations).toBe(collection.summary.totalObservations);
    expect(profile.stats.totalObservations).toBe(
      collection.summary.totalObservations,
    );
  });

  it("returns every official plant in numeric id order", async () => {
    const collection = await getCollectionData();

    expect(collection.officialPlants).toHaveLength(50);
    expect(collection.officialPlants.map(({ id }) => id)).toEqual(
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
  });

  it("derives collection state and representative images from observations", async () => {
    const { officialPlants } = await getCollectionData();
    const collected = officialPlants.find((plant) => plant.collected);
    const locked = officialPlants.find((plant) => !plant.collected);

    expect(collected?.observationCount).toBeGreaterThan(0);
    expect(collected?.representativeImageUrl).toBeTruthy();
    expect(locked?.observationCount).toBe(0);
    expect(locked?.representativeImageUrl).toBeNull();
  });

  it("groups nonofficial observations as other findings", async () => {
    const { otherFindings } = await getCollectionData();

    expect(otherFindings.length).toBeGreaterThan(0);
    expect(otherFindings.every(({ observationCount }) => observationCount > 0)).toBe(
      true,
    );
  });

  it("returns a detail only for a collected official plant", async () => {
    const { officialPlants } = await getCollectionData();
    const collected = officialPlants.find((plant) => plant.collected)!;
    const locked = officialPlants.find((plant) => !plant.collected)!;

    await expect(getPlantDetail(collected.id)).resolves.toMatchObject({
      official: true,
      id: collected.id,
    });
    await expect(getPlantDetail(locked.id)).resolves.toBeNull();
  });

  it("finds a nonofficial observation by scientific name", async () => {
    const { otherFindings } = await getCollectionData();

    await expect(getFindingDetail(otherFindings[0].scientificName)).resolves.toMatchObject({
      official: false,
      scientificName: otherFindings[0].scientificName,
    });
  });

  it("searches the official catalog by Korean and scientific name", async () => {
    const target = OFFICIAL_PLANTS[0];

    await expect(searchPlants(target.koreanName)).resolves.toContainEqual(
      expect.objectContaining({ id: target.id }),
    );
    await expect(searchPlants(target.scientificName)).resolves.toContainEqual(
      expect.objectContaining({ id: target.id }),
    );
  });

  it("returns different identify scenarios for different organs", async () => {
    const flower = await getMockIdentifyResult("flower");
    const leaf = await getMockIdentifyResult("leaf");

    expect(flower.candidates[0].scientificName).not.toBe(
      leaf.candidates[0].scientificName,
    );
  });

  it("returns duplicate and new observation scenarios from collection state", async () => {
    const { officialPlants } = await getCollectionData();
    const existing = officialPlants.find((plant) => plant.collected)!;
    const unseen = officialPlants.find((plant) => !plant.collected)!;
    const baseCandidate = (await getMockIdentifyResult("auto")).candidates[0];
    const candidateFor = (plant: (typeof officialPlants)[number]) => ({
      ...baseCandidate,
      plantId: plant.id,
      official: true,
      matchType: "exact" as const,
      koreanName: plant.koreanName,
      scientificName: plant.scientificName,
      scientificNameWithAuthor: plant.scientificName,
      stage: plant.stage,
      rarity: plant.rarity,
    });

    await expect(getMockObservationResult(candidateFor(existing))).resolves.toMatchObject({
      result: "duplicate",
    });
    await expect(getMockObservationResult(candidateFor(unseen))).resolves.toMatchObject({
      result: "new",
    });
  });

  it("creates an observation from a narrow plant selection", async () => {
    const plant = OFFICIAL_PLANTS[1];

    await expect(getMockObservationResult({
      plantId: plant.id,
      official: true,
      koreanName: plant.koreanName,
      scientificName: plant.scientificName,
      stage: plant.stage,
    })).resolves.toMatchObject({
      observation: {
        plantId: plant.id,
        scientificName: plant.scientificName,
        displayName: plant.koreanName,
      },
    });
  });

  it("matches backend rewards for new official plants by stage", async () => {
    const baseCandidate = (await getMockIdentifyResult("auto")).candidates[0];
    const candidates = ([2, 17, 30] as const).map((id) => {
      const plant = OFFICIAL_PLANTS.find((item) => item.id === id)!;
      return {
        ...baseCandidate,
        plantId: plant.id,
        official: true,
        scientificName: plant.scientificName,
        scientificNameWithAuthor: plant.scientificName,
        koreanName: plant.koreanName,
        stage: plant.stage,
        rarity: plant.rarity,
      };
    });

    await expect(getMockObservationResult(candidates[0])).resolves.toMatchObject({
      reward: { xp: 100 },
    });
    await expect(getMockObservationResult(candidates[1])).resolves.toMatchObject({
      reward: { xp: 125 },
    });
    await expect(getMockObservationResult(candidates[2])).resolves.toMatchObject({
      reward: { xp: 150 },
    });
  });

  it("pays only the flat re-observation amount for an already collected plant", async () => {
    const candidate = (await getMockIdentifyResult("leaf")).candidates.find(
      ({ plantId }) => plantId === 1,
    )!;

    await expect(getMockObservationResult(candidate)).resolves.toMatchObject({
      result: "duplicate",
      reward: { xp: 10, plantCount: 3 },
    });
  });

  it("awards no XP for nonofficial plants", async () => {
    const candidate = (await getMockIdentifyResult("flower")).candidates.find(
      ({ official }) => !official,
    )!;

    await expect(getMockObservationResult(candidate)).resolves.toMatchObject({
      reward: { xp: 0 },
    });
  });
});
