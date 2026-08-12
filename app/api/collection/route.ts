import { getOfficialPlant, OFFICIAL_PLANTS } from '@/data/official-plants'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageUrl } from '@/lib/server/image'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

type ObservationRow = {
  id: string
  scientific_name: string
  display_name: string
  image_path: string
  observed_at: string
}

type CountRow = {
  scientific_name: string
  count: number
}

export async function GET(request: Request) {
  const userId = userIdFrom(request)
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    const { data: countData, error: countError } = await supabase
      .from('user_plant_counts')
      .select('scientific_name,count')
      .eq('user_id', userId)

    if (countError) throw countError

    const { data: observationData, error: observationError } = await supabase
      .from('observations')
      .select('id,scientific_name,display_name,image_path,observed_at')
      .eq('user_id', userId)
      .order('observed_at', { ascending: false })

    if (observationError) throw observationError

    const counts = (countData || []) as CountRow[]
    const observations = (observationData || []) as ObservationRow[]
    const countByName = new Map(
      counts.map((item) => [item.scientific_name, item.count]),
    )
    const latestByName = new Map<string, ObservationRow>()

    for (const item of observations) {
      if (!latestByName.has(item.scientific_name)) {
        latestByName.set(item.scientific_name, item)
      }
    }

    const collection = OFFICIAL_PLANTS.map((plant) => {
      const count = countByName.get(plant.scientificName) || 0
      const latest = latestByName.get(plant.scientificName)
      return {
        id: plant.id,
        koreanName: plant.koreanName,
        scientificName: plant.scientificName,
        stage: plant.stage,
        rarity: plant.rarity,
        collected: count > 0,
        observationCount: count,
        representativeImageUrl: latest ? imageUrl(latest.image_path) : null,
      }
    })

    const others = counts
      .filter((item) => !getOfficialPlant(item.scientific_name))
      .map((item) => {
        const latest = latestByName.get(item.scientific_name)
        return {
          scientificName: item.scientific_name,
          displayName: latest?.display_name || item.scientific_name,
          observationCount: item.count,
          representativeImageUrl: latest ? imageUrl(latest.image_path) : '',
          lastObservedAt: latest?.observed_at || '',
        }
      })

    const total = OFFICIAL_PLANTS.length
    const collected = collection.filter((item) => item.collected).length

    return ok({
      summary: {
        total,
        collected,
        completionRate: total ? Math.round((collected / total) * 100) : 0,
      },
      plants: collection,
      others,
    })
  } catch (error) {
    return fail('도감 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
