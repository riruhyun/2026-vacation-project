import { describe, expect, it } from "vitest";
import {
  levelProgress,
  observationXp,
  observationXpEvents,
  totalXpForLevel,
  xpDayStartIso,
  xpForNextLevel,
} from "@/lib/progress";

describe("observation XP", () => {
  it("pays base + first discovery + rarity on a first discovery", () => {
    expect(
      observationXp({ rarity: "common", firstDiscovery: true, sameDayRepeat: false }),
    ).toBe(100);
    expect(
      observationXp({ rarity: "uncommon", firstDiscovery: true, sameDayRepeat: false }),
    ).toBe(125);
    expect(
      observationXp({ rarity: "rare", firstDiscovery: true, sameDayRepeat: false }),
    ).toBe(150);
  });

  it("pays only the base XP when the species is already collected", () => {
    for (const rarity of ["common", "uncommon", "rare"] as const) {
      expect(
        observationXp({ rarity, firstDiscovery: false, sameDayRepeat: false }),
      ).toBe(10);
    }
  });

  it("pays nothing for the same species on the same day", () => {
    expect(
      observationXp({ rarity: "rare", firstDiscovery: true, sameDayRepeat: true }),
    ).toBe(0);
    expect(
      observationXpEvents({
        rarity: "rare",
        firstDiscovery: true,
        sameDayRepeat: true,
      }),
    ).toEqual([]);
  });

  it("skips the discovery and rarity bonus for plants outside the collection", () => {
    expect(
      observationXpEvents({
        rarity: null,
        firstDiscovery: true,
        sameDayRepeat: false,
      }),
    ).toEqual([{ type: "observation", label: "관찰", xp: 10 }]);
  });

  it("labels every reason so the card screen can list them", () => {
    expect(
      observationXpEvents({
        rarity: "uncommon",
        firstDiscovery: true,
        sameDayRepeat: false,
      }),
    ).toEqual([
      { type: "observation", label: "관찰", xp: 10 },
      { type: "first_discovery", label: "첫 발견", xp: 90 },
      { type: "rarity_uncommon", label: "보통 희귀도", xp: 25 },
    ]);
  });

  it("makes one new common species worth ten re-observations", () => {
    expect(
      observationXp({ rarity: "common", firstDiscovery: true, sameDayRepeat: false }),
    ).toBe(
      observationXp({
        rarity: "common",
        firstDiscovery: false,
        sameDayRepeat: false,
      }) * 10,
    );
  });
});

describe("levels", () => {
  it("needs 100 XP for level 2 and 50 more per level after that", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(150);
    expect(xpForNextLevel(9)).toBe(500);
  });

  it("matches the cumulative XP formula", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(250);
    expect(totalXpForLevel(10)).toBe(2700);
  });

  it("derives the level and the in-level progress from the total XP alone", () => {
    expect(levelProgress(0)).toEqual({
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100,
    });
    // 첫 흔한 식물을 발견하면 곧바로 Lv.2가 됩니다.
    expect(levelProgress(100)).toEqual({
      level: 2,
      currentXp: 0,
      xpToNextLevel: 150,
    });
    expect(levelProgress(380)).toEqual({
      level: 3,
      currentXp: 130,
      xpToNextLevel: 200,
    });
  });

  it("keeps levelProgress and totalXpForLevel consistent", () => {
    for (let level = 1; level <= 12; level += 1) {
      expect(levelProgress(totalXpForLevel(level)).level).toBe(level);
      expect(levelProgress(totalXpForLevel(level) - 1).level).toBe(
        Math.max(level - 1, 1),
      );
    }
  });
});

describe("same day window", () => {
  it("starts at midnight Korean time", () => {
    // 2026-08-16 09:30 KST = 2026-08-16 00:30 UTC
    expect(xpDayStartIso(new Date("2026-08-16T00:30:00.000Z"))).toBe(
      "2026-08-15T15:00:00.000Z",
    );
    // 2026-08-15 23:30 KST = 2026-08-15 14:30 UTC (아직 같은 날)
    expect(xpDayStartIso(new Date("2026-08-15T14:30:00.000Z"))).toBe(
      "2026-08-14T15:00:00.000Z",
    );
  });
});
