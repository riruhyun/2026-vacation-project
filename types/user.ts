import type { PlantStage, RarityCode } from "./domain"
import type { ObservationDto } from "./observation"
import type { CollectionPlantDto, OtherFindingDto } from "./plant"

export type ActivityLogType = "new_plant" | "level_up"

export type ActivityLogDto = {
  id: string
  type: ActivityLogType
  scientificName: string | null
  displayName: string | null
  level: number | null
  levelTitle: string | null
  createdAt: string
}

export type Profile = {
  nickname: string | null
  /** 누적 경험치 */
  xp: number
  level: number
  currentLevelXp: number
  xpToNextLevel: number
  /** 닉네임과 대표 식물을 한 번이라도 저장했으면 true입니다. false면 온보딩 화면으로 보냅니다. */
  onboarded?: boolean
}

/** 프로필에 띄우는 대표 식물입니다. 아직 사진이 없으면 imageUrl이 null입니다. */
export type FeaturedPlantDto = {
  id: number
  koreanName: string
  scientificName: string
  stage: PlantStage
  rarity: RarityCode
  imageUrl: string | null
  observationCount: number
}

export type ProfileStats = {
  totalObservations: number
  /** 수집한 공식 도감 종 수입니다. 화면의 30/50에서 앞의 수입니다. */
  officialPlants: number
  /** 공식 도감 전체 종 수입니다. 화면의 30/50에서 뒤의 수입니다. */
  totalOfficialPlants?: number
  otherPlants: number
  /** 0부터 100 사이의 정수 */
  completionRate: number
  lastObservedAt: string | null
}

export type ProfileResponse = {
  profile: Profile
  featuredPlants?: FeaturedPlantDto[]
  stats: ProfileStats
  recentActivities?: ActivityLogDto[]
}

/** PATCH /api/profile로 보내는 값입니다. 보낸 항목만 바뀝니다. */
export type UpdateProfileInput = {
  nickname?: string
  /** 대표 식물 collection card id입니다. 최대 3개이고 수집한 식물만 고를 수 있습니다. */
  featuredPlantIds?: number[]
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
  /** Legacy profile UI compatibility. Always provide an array, even when no data exists. */
  recentObservations: ObservationDto[]
}

/** 온보딩과 프로필 편집 화면이 쓰는 값입니다. */
export type ProfileEditorData = {
  nickname: string
  featuredPlantIds: number[]
  onboarded: boolean
  /** 대표 식물로 고를 수 있는 후보. 수집한 식물만 들어옵니다. */
  collectedPlants: CollectionPlantDto[]
}
