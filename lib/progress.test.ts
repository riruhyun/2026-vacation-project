import { describe, expect, it } from "vitest";
import { levelMilestonesUpTo, levelTitle } from "@/lib/progress";

describe("level activity rules", () => {
  it("uses increasingly spaced milestones", () => {
    expect(levelMilestonesUpTo(60)).toEqual([1, 7, 15, 25, 37, 51]);
  });

  it("keeps level titles to five tiers", () => {
    expect(levelTitle(1)).toBe("새싹 관찰자");
    expect(levelTitle(7)).toBe("초록 탐험가");
    expect(levelTitle(15)).toBe("식물 수집가");
    expect(levelTitle(25)).toBe("도감 기록가");
    expect(levelTitle(99)).toBe("도감 완성가");
  });
});
