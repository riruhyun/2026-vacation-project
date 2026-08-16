import type { CollectionPlantDto, OtherFindingDto } from "./plant"
import type { ActivityDto } from "./activity"

export type Profile = {
  nickname: string | null
  /** 프로필 사진 주소. 설정 전이면 null입니다. */
  avatarUrl: string | null
  /** 누적 경험치 */
  xp: number
  level: number
  currentLevelXp: number
  xpToNextLevel: number
}

/** PATCH /api/profile 응답. 바뀔 수 있는 값만 돌려줍니다. */
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
