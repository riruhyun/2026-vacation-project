import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageUrl } from '@/lib/server/image'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

type PlantRow = {
  id: number
  korean_name: string
  scientific_name: string
  rarity: string
}

type ObservationRow = {
  id: string
  plant_id: number | null
  scientific_name: string
  display_name: string
  image_path: string
  observed_at: string
}

export async function GET(request: Request) {
  const userId = userIdFrom(request)
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    const { data: plantData, error: plantError } = await supabase
      .from('plants')
      .select('id,korean_name,scientific_name,rarity')
      .order('id')

    if (plantError) throw plantError

    const { data: observationData, error: observationError } = await supabase
      .from('observations')
      .select('id,plant_id,scientific_name,display_name,image_path,observed_at')
      .eq('user_id', userId)
      .order('observed_at', { ascending: false })

    if (observationError) throw observationError

    const plants = (plantData || []) as PlantRow[]
    const observations = (observationData || []) as ObservationRow[]
    const collectedPlantIds = new Set(
      observations.flatMap((item) => (item.plant_id ? [item.plant_id] : [])),
    )

    const collection = plants.map((plant) => {
      const records = observations.filter((item) => item.plant_id === plant.id)
      return {
        id: plant.id,
        koreanName: plant.korean_name,
        scientificName: plant.scientific_name,
        rarity: plant.rarity,
        collected: records.length > 0,
        observationCount: records.length,
        representativeImageUrl: records[0]
          ? imageUrl(records[0].image_path)
          : null,
      }
    })

    const otherByName = new Map<
      string,
      {
        scientificName: string
        displayName: string
        observationCount: number
        representativeImageUrl: string
        lastObservedAt: string
      }
    >()

    for (const item of observations.filter((record) => record.plant_id === null)) {
      const previous = otherByName.get(item.scientific_name)
      if (previous) {
        previous.observationCount += 1
      } else {
        otherByName.set(item.scientific_name, {
          scientificName: item.scientific_name,
          displayName: item.display_name,
          observationCount: 1,
          representativeImageUrl: imageUrl(item.image_path),
          lastObservedAt: item.observed_at,
        })
      }
    }

    const total = plants.length
    const collected = collectedPlantIds.size

    return ok({
      summary: {
        total,
        collected,
        completionRate: total ? Math.round((collected / total) * 100) : 0,
      },
      plants: collection,
      others: Array.from(otherByName.values()),
    })
  } catch (error) {
    return fail('도감 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
