import type { PlantStage } from "@/types/domain";

export const BASE_XP_BY_STAGE: Record<PlantStage, number> = {
  1: 50,
  2: 90,
  3: 140,
};

// 칭호는 도감을 얼마나 모았느냐를 나타냅니다.
// 숲을 지키거나 안내하는 역할이 아니므로 수집 흐름에 맞는 이름만 씁니다.
export const LEVEL_TITLES = [
  { level: 1, title: "새싹 관찰자" },
  { level: 7, title: "초록 탐험가" },
  { level: 15, title: "식물 수집가" },
  { level: 25, title: "도감 기록가" },
  { level: 37, title: "도감 완성가" },
] as const;

export function levelTitle(level: number) {
  return [...LEVEL_TITLES]
    .reverse()
    .find((item) => level >= item.level)?.title || LEVEL_TITLES[0].title;
}

export function levelMilestonesUpTo(maxLevel: number) {
  const milestones: number[] = [];
  let level = 1;
  let gap = 6;

  while (level <= maxLevel) {
    milestones.push(level);
    level += gap;
    gap += 2;
  }

  return milestones;
}

export function observationXp(stage: PlantStage | null, previousCount: number) {
  if (!stage) return 0;
  return Math.max(
    5,
    Math.round(BASE_XP_BY_STAGE[stage] / 2 ** Math.max(previousCount, 0)),
  );
}

export function xpForNextLevel(level: number) {
  return 400 + Math.max(level - 1, 0) * 50;
}

export function levelProgress(totalXp: number) {
  let level = 1;
  let currentXp = Math.max(totalXp, 0);
  let needed = xpForNextLevel(level);

  while (currentXp >= needed) {
    currentXp -= needed;
    level += 1;
    needed = xpForNextLevel(level);
  }

  return { level, currentXp, xpToNextLevel: needed };
}
