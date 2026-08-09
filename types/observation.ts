/** 첫 발견이면 new, 이미 도감에 있으면 duplicate입니다. */
export type ObservationResult = 'new' | 'duplicate'

/**
 * 저장된 관찰 기록입니다.
 * DB 컬럼명을 그대로 쓰기 때문에 이 객체만 snake_case입니다. (imageUrl은 서버가 덧붙입니다.)
 */
export type Observation = {
  id: string
  plant_id: number | null
  scientific_name: string
  display_name: string
  image_path: string
  observed_at: string
  imageUrl: string
}

export type CreateObservationResponse = {
  result: ObservationResult
  observation: Observation
}

/** POST /api/observations 입력. 공식 식물이면 plantId만, 기타 식물이면 이름 두 개를 보냅니다. */
export type CreateObservationInput = {
  image: File
  plantId?: number | null
  scientificName?: string
  displayName?: string
}
