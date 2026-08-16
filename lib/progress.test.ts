import { describe, expect, it } from "vitest";
import {
  levelMilestonesUpTo,
  levelProgress,
  levelTitle,
  observationXp,
  toBaseXp,
  xpForNextLevel,
} from "@/lib/progress";

describe("level activity rules", () => {
  it("uses increasingly spaced milestones", () => {
    expect(levelMilestonesUpTo(60)).toEqual([1, 7, 15, 25, 37, 51]);
  });

  it("keeps level titles to five tiers", () => {
    expect(levelTitle(1)).toBe("새싹 관찰자");
    expect(levelTitle(4)).toBe("초록 탐험가");
    expect(levelTitle(8)).toBe("식물 수집가");
    expect(levelTitle(12)).toBe("도감 기록가");
    expect(levelTitle(99)).toBe("도감 완성가");
  });

  it("keeps every title reachable within the current deck", () => {
    // 카드 50장을 다 모으면 6,375 XP, 즉 Lv.15입니다.
    // 마지막 칭호가 그 안에 들어와야 아무도 못 보는 칭호가 생기지 않습니다.
    expect(levelProgress(6375).level).toBe(15);
  });
});

describe("observation rewards", () => {
  it("pays the base amount plus a first-discovery bonus", () => {
    expect(observationXp("common", 0)).toEqual({
      xp: 100,
      breakdown: [
        { label: "관찰", xp: 10 },
        { label: "첫 발견", xp: 90 },
      ],
    });
  });

  it("adds a rarity bonus only for uncommon and rare", () => {
    expect(observationXp("uncommon", 0).xp).toBe(125);
    expect(observationXp("rare", 0).xp).toBe(150);
    // 흔함은 기준점이라 보너스 줄이 아예 생기지 않아야 합니다.
    expect(observationXp("common", 0).breakdown).toHaveLength(2);
    expect(observationXp("rare", 0).breakdown).toHaveLength(3);
  });

  it("drops the rarity bonus once the species is already collected", () => {
    // 희귀 식물 하나만 반복 촬영해 레벨을 올리지 못하게 막는 규칙입니다.
    expect(observationXp("rare", 1)).toEqual({
      xp: 10,
      breakdown: [{ label: "재관찰", xp: 10 }],
    });
    expect(observationXp("common", 5).xp).toBe(10);
  });

  it("keeps a new species worth about ten re-observations", () => {
    expect(observationXp("common", 0).xp).toBe(observationXp("common", 1).xp * 10);
  });

  it("pays nothing for the same species on the same day", () => {
    expect(observationXp("rare", 0, true)).toEqual({ xp: 0, breakdown: [] });
    expect(observationXp("common", 3, true).xp).toBe(0);
  });

  it("pays nothing for plants outside the deck", () => {
    expect(observationXp(null, 0)).toEqual({ xp: 0, breakdown: [] });
  });
});

describe("passing the reward through the shared DB function", () => {
  // DB 함수는 넘겨받은 값을 2^재관찰횟수로 나눈 뒤 최소 5를 보장합니다.
  // 함수를 못 바꾸므로, 부풀린 값이 그 계산을 통과해 원래 값으로 돌아오는지 봅니다.
  function asDatabaseWouldPay(baseXp: number, previousCount: number) {
    if (baseXp <= 0) return 0;
    return Math.max(5, Math.round(baseXp / 2 ** previousCount));
  }

  it("comes back out as the amount we intended", () => {
    for (const previousCount of [0, 1, 2, 3, 7, 20]) {
      const earned = observationXp("rare", previousCount);
      expect(
        asDatabaseWouldPay(toBaseXp(earned.xp, previousCount), previousCount),
      ).toBe(earned.xp);
    }
  });

  it("stays inside a postgres integer", () => {
    expect(toBaseXp(10, 1000)).toBeLessThan(2_147_483_647);
  });

  it("sends zero straight through so no minimum kicks in", () => {
    // 같은 날 재촬영과 도감 밖 식물은 0이어야 합니다. 하한 5가 붙으면 안 됩니다.
    expect(toBaseXp(0, 3)).toBe(0);
    expect(asDatabaseWouldPay(toBaseXp(0, 3), 3)).toBe(0);
  });
});

describe("level curve", () => {
  it("needs 100 xp for the first level so the first card levels you up", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(levelProgress(100).level).toBe(2);
  });

  it("adds 50 xp to each following level", () => {
    expect(xpForNextLevel(2)).toBe(150);
    expect(xpForNextLevel(3)).toBe(200);
  });

  it("reports progress inside the current level, not the running total", () => {
    // 누적 380 XP는 Lv.3(누적 250부터) 안에서 130을 번 상태입니다.
    expect(levelProgress(380)).toEqual({
      level: 3,
      currentXp: 130,
      xpToNextLevel: 200,
    });
  });

  it("treats a missing or negative total as the start of level 1", () => {
    expect(levelProgress(0)).toEqual({
      level: 1,
      currentXp: 0,
      xpToNextLevel: 100,
    });
    expect(levelProgress(-50).level).toBe(1);
  });
});
