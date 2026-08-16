import type { CollectionPlantDto, OtherFindingDto } from "./plant"
import type { ActivityDto } from "./activity"

export type Profile = {
  nickname: string | null
  /** 누적 경험치 */
  xp: number
  level: number
  currentLevelXp: number
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

export type HomeData = {
  profile: Profile
  levelTitle: string
  totalObservations: number
  completionRate: number
  recentPlants: Array<CollectionPlantDto | OtherFindingDto>
}

export type ProfilePageData = ProfileResponse & {
  levelTitle: string
  recentActivities: ActivityDto[]
}
