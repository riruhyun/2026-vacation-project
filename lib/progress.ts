import { RARITY_LABEL, type PlantStage, type RarityCode } from "@/types/domain";

// 유효한 관찰 1회마다 지급하는 기본 경험치
export const OBSERVATION_XP = 10;

// 도감에 처음 등록되는 종에만 1회 지급
export const FIRST_DISCOVERY_XP = 90;

// 희귀도 보너스도 최초 발견 때 한 번만 지급. 흔함이 기준점이라 0임.
export const RARITY_BONUS_XP: Record<RarityCode, number> = {
  common: 0,
  uncommon: 25,
  rare: 50,
};

// 도감 카드 단계는 희귀도와 1:1로 대응
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

// 지급 내역
export type XpEvent = {
  type: XpEventType;
  label: string;
  xp: number;
};

export type ObservationXpInput = {
  // 도감 카드 희귀도. 도감에 없는 기타 식물이면 null
  rarity: RarityCode | null;
  // 이 종을 처음 기록하는 관찰인지 여부
  firstDiscovery: boolean;
  // 같은 날 같은 종을 이미 기록했는지 여부
  sameDayRepeat: boolean;
};

// 최초 발견: 기본 + 첫 발견 + 희귀도
// 재관찰: 기본만
// 같은 날 같은 종 재촬영: 지급 없음
export function observationXpEvents(input: ObservationXpInput): XpEvent[] {
  if (input.sameDayRepeat) return [];

  const events: XpEvent[] = [
    {
      type: "observation",
      label: input.firstDiscovery ? "관찰" : "재관찰",
      xp: OBSERVATION_XP,
    },
  ];

  // 첫 발견 및 희귀도 보너스는 도감 카드를 처음 등록할 때만 지급
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

// 현재 레벨에서 다음 레벨까지 필요한 XP
export function xpForNextLevel(level: number) {
  return 100 + Math.max(level - 1, 0) * 50;
}

// Lv.N 도달에 필요한 누적 XP = 100(N-1) + 25(N-1)(N-2)
export function totalXpForLevel(level: number) {
  const target = Math.max(level, 1);
  return 100 * (target - 1) + 25 * (target - 1) * (target - 2);
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

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function xpDayStartIso(now: Date = new Date()) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - KST_OFFSET_MS).toISOString();
}
