import { RARITY_LABEL, type PlantStage, type RarityCode } from "@/types/domain";

/** 유효한 관찰이면 무엇을 찍었든 받는 값입니다. 재관찰에서 받는 값도 이것뿐입니다. */
export const OBSERVATION_XP = 10;

/** 도감에 처음 들어오는 종에만 한 번 붙습니다. */
export const FIRST_DISCOVERY_XP = 90;

/**
 * 희귀도 보너스는 첫 발견에만 붙입니다.
 *
 * 재관찰에도 주면 희귀 식물 한 종을 찾아낸 뒤 그것만 반복 촬영하는 쪽이
 * 새 종을 찾는 것보다 이득이 됩니다. 흔함이 0인 것도 같은 이유입니다.
 * 흔함을 기준점으로 두어야 "흔한데 왜 희귀도 보너스를 받지"가 안 나옵니다.
 */
export const RARITY_BONUS_XP: Record<RarityCode, number> = {
  common: 0,
  uncommon: 25,
  rare: 50,
};

export const RARITY_BY_STAGE: Record<PlantStage, RarityCode> = {
  1: "common",
  2: "uncommon",
  3: "rare",
};

/** 카드 획득 화면이 "왜 이만큼 받았는지" 그대로 읽을 수 있게 나눠 둔 항목입니다. */
export type XpReason = {
  label: string;
  xp: number;
};

export type ObservationReward = {
  xp: number;
  breakdown: XpReason[];
};

const NO_REWARD: ObservationReward = { xp: 0, breakdown: [] };

function withTotal(breakdown: XpReason[]): ObservationReward {
  return {
    xp: breakdown.reduce((sum, reason) => sum + reason.xp, 0),
    breakdown,
  };
}

// 칭호는 도감을 얼마나 모았느냐를 나타냅니다.
// 숲을 지키거나 안내하는 역할이 아니므로 수집 흐름에 맞는 이름만 씁니다.
//
// 기준 레벨은 카드 50장을 다 모으면 Lv.15에 닿는 현재 곡선에 맞춰 잡았습니다.
// 대략 4장, 14장, 30장, 47장 지점입니다. 곡선이나 카드 수가 바뀌면 여기도 함께 봐야 합니다.
export const LEVEL_TITLES = [
  { level: 1, title: "새싹 관찰자" },
  { level: 4, title: "초록 탐험가" },
  { level: 8, title: "식물 수집가" },
  { level: 12, title: "도감 기록가" },
  { level: 15, title: "도감 완성가" },
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

/**
 * 관찰 하나가 받을 경험치를 정합니다.
 *
 * 새 종을 찾는 쪽이 압도적으로 이득이어야 하므로 첫 발견 100~150 대 재관찰 10,
 * 즉 새 종 하나가 재관찰 열 번쯤의 가치를 갖도록 잡았습니다.
 * 같은 날 같은 종을 또 찍는 것은 같은 발견이므로 보상이 없습니다.
 */
export function observationXp(
  rarity: RarityCode | null,
  previousCount: number,
  observedToday = false,
): ObservationReward {
  // 도감에 없는 식물은 발견 횟수만 늘리고 경험치는 주지 않습니다.
  if (!rarity) return NO_REWARD;
  if (observedToday) return NO_REWARD;

  if (previousCount > 0) {
    return withTotal([{ label: "재관찰", xp: OBSERVATION_XP }]);
  }

  const bonus = RARITY_BONUS_XP[rarity];

  return withTotal([
    { label: "관찰", xp: OBSERVATION_XP },
    { label: "첫 발견", xp: FIRST_DISCOVERY_XP },
    ...(bonus > 0
      ? [{ label: `${RARITY_LABEL[rarity]} 희귀도`, xp: bonus }]
      : []),
  ]);
}

/**
 * 위에서 정한 경험치를 DB 함수가 그대로 지급하도록 값을 부풀립니다.
 *
 * record_collection_observation_reward는 넘겨받은 값을 2^재관찰횟수로 나눈 뒤
 * 최소 5를 보장합니다. 예전 규칙(재관찰마다 절반)의 잔재인데, 이 함수는 팀 전체가
 * 공유하는 DB에 있어 우리 쪽에서 바꾸면 다른 브랜치의 보상까지 같이 바뀝니다.
 * 그래서 함수를 건드리는 대신 나눠질 만큼 미리 곱해서 넘깁니다.
 *
 * p_base_xp가 integer라 무한정 곱할 수는 없습니다. 같은 카드를 27번 넘게
 * 다시 찍으면 그 뒤로는 SQL의 하한인 5가 지급됩니다. 시연 범위 밖이라 그대로 둡니다.
 */
export const MAX_DOUBLING = 27;

export function toBaseXp(xp: number, previousCount: number) {
  if (xp <= 0) return 0;
  return xp * 2 ** Math.min(Math.max(previousCount, 0), MAX_DOUBLING);
}

/**
 * 레벨 N에서 N+1로 가는 데 필요한 경험치입니다.
 *
 * 첫 식물을 찍자마자 Lv.2가 뜨도록 100에서 시작합니다. 첫 카드에서 보상을
 * 크게 체감시키고, 이후 50씩 늘려 서서히 느려지게 합니다.
 */
export function xpForNextLevel(level: number) {
  return 100 + Math.max(level - 1, 0) * 50;
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
