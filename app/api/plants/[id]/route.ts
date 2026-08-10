import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageUrl } from '@/lib/server/image'
import { getPlantInformation } from '@/lib/server/inaturalist'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const plantId = Number(id)

    if (!Number.isInteger(plantId) || plantId < 1) {
      return fail('식물 ID가 올바르지 않습니다.')
    }

    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id,korean_name,scientific_name,rarity')
      .eq('id', plantId)
      .maybeSingle()

    if (plantError) throw plantError
    if (!plant) return fail('식물을 찾을 수 없습니다.', 404)

    const information = await getPlantInformation(plant.scientific_name)

    const userId = userIdFrom(request)
    let observations: Array<{
      id: string
      image_path: string
      observed_at: string
    }> = []

    if (userId) {
      const { data, error } = await supabase
        .from('observations')
        .select('id,image_path,observed_at')
        .eq('user_id', userId)
        .eq('plant_id', plantId)
        .order('observed_at', { ascending: false })

      if (error) throw error
      observations = data || []
    }

    return ok({
      plant: {
        id: plant.id,
        official: true,
        koreanName: information?.koreanName || plant.korean_name,
        scientificName: information?.scientificName || plant.scientific_name,
        rarity: plant.rarity,
        information,
        informationSource: 'iNaturalist',
      },
      userCollection: {
        collected: observations.length > 0,
        observationCount: observations.length,
        observations: observations.map((item) => ({
          id: item.id,
          imageUrl: imageUrl(item.image_path),
          observedAt: item.observed_at,
        })),
      },
    })
  } catch (error) {
    return fail('식물 상세 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
