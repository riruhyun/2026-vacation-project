import type { PlantStage } from "@/types/domain";

export const BASE_XP_BY_STAGE: Record<PlantStage, number> = {
  1: 50,
  2: 90,
  3: 140,
};

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
