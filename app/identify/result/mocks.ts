import type {
  DuplicateObservationViewModel,
  NewPlantRewardViewModel,
} from "./types";

export const newPlantRewardMock = {
  speciesId: "sancheoljjuk",
  koreanName: "산철쭉",
  scientificName: "Rhododendron yedoense",
  rarity: "보통",
  photoUrl: "/images/identify-result/sancheoljjuk.svg",
  discoveredAt: "2026. 8. 3",
  baseXp: 100,
  rarityBonusXp: 30,
} satisfies NewPlantRewardViewModel;

export const duplicateObservationMock = {
  speciesId: "mindeulle",
  koreanName: "민들레",
  photoUrl: "/images/identify-result/mindeulle.svg",
  observedAt: "2026. 8. 3",
  observationCount: 3,
  rewardXp: 10,
  canReplaceCoverPhoto: true,
} satisfies DuplicateObservationViewModel;
