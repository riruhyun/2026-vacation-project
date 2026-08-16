import type { ObservationId, PlantId, PlantStage, RarityCode } from "./domain";
import type { XpEvent } from "@/lib/progress";

export type ObservationResult = "new" | "duplicate";

export type ObservationSelection = {
  plantId: PlantId | null;
  official: boolean;
  koreanName: string;
  scientificName: string;
  stage: PlantStage | null;
  /** 희귀도 보너스 계산용. 없으면 stage에서 파생합니다. */
  rarity?: RarityCode | null;
};

export type ObservationDto = {
  id: ObservationId;
  plantId: PlantId | null;
  scientificName: string;
  displayName: string;
  imagePath: string;
  observedAt: string;
  imageUrl: string;
};

export type CreateObservationResponseDto = {
  result: ObservationResult;
  observation: ObservationDto;
  reward: {
    /** 이번 관찰로 받은 XP. breakdown의 합과 항상 같습니다. */
    xp: number;
    /** 지급 사유별 내역. 카드 획득 화면에 한 줄씩 보여줍니다. */
    breakdown: XpEvent[];
    /** 누적 XP. 레벨의 기준값입니다. */
    totalXp: number;
    level: number;
    /** 현재 레벨 구간에서 모은 XP */
    currentLevelXp: number;
    /** 다음 레벨까지 필요한 총량 */
    xpToNextLevel: number;
    leveledUp: boolean;
    plantCount: number;
  };
};

export type CreateObservationInput = {
  image: File;
  plantId?: PlantId | null;
  scientificName?: string;
  genusName?: string | null;
  displayName?: string;
  identificationScore?: number;
  identificationCandidates?: Array<{
    scientificName: string;
    genusName: string | null;
    score: number;
  }>;
};
