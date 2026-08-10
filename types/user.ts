export type Profile = {
  nickname: string | null
  /** 누적 경험치. 레벨 계산은 게임 UI 담당이 프론트에서 처리합니다. */
  xp: number
}

export interface UserProgress {
  nickname: string
  level: number
  levelTitle: string
  currentXp: number
  xpToNextLevel: number
}

export type ProfileStats = {
  totalObservations: number
  officialPlants: number
  otherPlants: number
  /** 0부터 100 사이의 정수 */
  completionRate: number
  lastObservedAt: string | null
}

export type ProfileResponse = {
  profile: Profile
  stats: ProfileStats
}
