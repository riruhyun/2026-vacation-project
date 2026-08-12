export type Profile = {
  nickname: string | null
  /** 누적 경험치 */
  xp: number
  level: number
  currentLevelXp: number
  xpToNextLevel: number
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
