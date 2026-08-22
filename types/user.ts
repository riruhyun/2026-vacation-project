import type { CollectionPlantDto, OtherFindingDto } from "./plant"
import type { ActivityDto } from "./activity"

export type Profile = {
  nickname: string | null
  avatarUrl: string | null
  xp: number
  level: number
  currentLevelXp: number
  xpToNextLevel: number
}

export type UpdateProfileResponse = {
  profile: Pick<Profile, "nickname" | "avatarUrl">
}

export type UpdateProfileInput = {
  nickname?: string
  avatar?: File
}

export type ProfileStats = {
  totalObservations: number
  officialPlants: number
  otherPlants: number
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
