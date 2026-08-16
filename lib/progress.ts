import { RARITY_LABEL, type PlantStage, type RarityCode } from "@/types/domain";

/**
 * 경험치 규칙의 단일 기준점입니다.
 * XP는 이 파일에서만 계산하고, Supabase 함수는 계산된 값을 그대로 적립합니다.
 */

/** 유효한 관찰 1회마다 지급하는 기본 경험치 */
export const OBSERVATION_XP = 10;

/** 도감에 처음 등록되는 종에만 1회 지급 */
export const FIRST_DISCOVERY_XP = 90;

/** 희귀도 보너스도 최초 발견 때 한 번만 지급합니다. 흔함이 기준점이라 0입니다. */
export const RARITY_BONUS_XP: Record<RarityCode, number> = {
  common: 0,
  uncommon: 25,
  rare: 50,
};

/** 도감 카드 단계는 희귀도와 1:1로 대응합니다. */
export const STAGE_RARITY: Record<PlantStage, RarityCode> = {
  1: "common",
  2: "uncommon",
  3: "rare",
};

export type XpEventType =
  | "observation"
  | "first_discovery"
  | "rarity_common"
  | "rarity_uncommon"
  | "rarity_rare";

/** 카드 획득 화면에 그대로 한 줄씩 보여줄 수 있는 지급 내역입니다. */
export type XpEvent = {
  type: XpEventType;
  label: string;
  xp: number;
};

export type ObservationXpInput = {
  /** 도감 카드 희귀도. 도감에 없는 기타 식물이면 null */
  rarity: RarityCode | null;
  /** 이 종을 처음 기록하는 관찰인지 */
  firstDiscovery: boolean;
  /** 같은 날 같은 종을 이미 기록했는지 */
  sameDayRepeat: boolean;
};

/**
 * 최초 발견: 기본 + 첫 발견 + 희귀도
 * 재관찰: 기본만
 * 같은 날 같은 종 재촬영: 지급 없음
 */
export function observationXpEvents(input: ObservationXpInput): XpEvent[] {
  if (input.sameDayRepeat) return [];

  const events: XpEvent[] = [
    {
      type: "observation",
      label: input.firstDiscovery ? "관찰" : "재관찰",
      xp: OBSERVATION_XP,
    },
  ];

  // 첫 발견·희귀도 보너스는 도감 카드를 처음 등록할 때만 붙습니다.
  if (!input.firstDiscovery || !input.rarity) return events;

  events.push({
    type: "first_discovery",
    label: "첫 발견",
    xp: FIRST_DISCOVERY_XP,
  });
  events.push({
    type: `rarity_${input.rarity}`,
    label: `${RARITY_LABEL[input.rarity]} 희귀도`,
    xp: RARITY_BONUS_XP[input.rarity],
  });

  return events;
}

export function sumXp(events: XpEvent[]) {
  return events.reduce((total, event) => total + event.xp, 0);
}

export function observationXp(input: ObservationXpInput) {
  return sumXp(observationXpEvents(input));
}

/** 현재 레벨에서 다음 레벨까지 필요한 XP */
export function xpForNextLevel(level: number) {
  return 100 + Math.max(level - 1, 0) * 50;
}

/** Lv.N 도달에 필요한 누적 XP = 100(N-1) + 25(N-1)(N-2) */
export function totalXpForLevel(level: number) {
  const target = Math.max(level, 1);
  return 100 * (target - 1) + 25 * (target - 1) * (target - 2);
}

/** 저장된 값은 누적 XP 하나뿐이고, 레벨과 구간 진행도는 여기서 파생합니다. */
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

/** 같은 날 판정은 한국 시간 자정을 경계로 합니다. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 오늘(한국 시간) 시작 시각을 UTC ISO 문자열로 돌려줍니다. */
export function xpDayStartIso(now: Date = new Date()) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - KST_OFFSET_MS).toISOString();
}
