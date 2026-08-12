import { getOfficialPlantById } from '@/data/official-plants'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { getForestPlant } from '@/lib/server/forest'
import { imageUrl } from '@/lib/server/image'
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

    const plant = getOfficialPlantById(plantId)
    if (!plant) return fail('식물을 찾을 수 없습니다.', 404)

    const forestPlant = await getForestPlant(plant.scientificName)

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
        .eq('scientific_name', plant.scientificName)
        .order('observed_at', { ascending: false })

      if (error) throw error
      observations = data || []
    }

    return ok({
      plant: {
        id: plant.id,
        official: true,
        koreanName: forestPlant?.koreanName || plant.koreanName,
        scientificName: plant.scientificName,
        stage: plant.stage,
        rarity: plant.rarity,
        description: forestPlant?.description || null,
        informationSource: '산림청 국립수목원',
        informationSourceUrl:
          'https://www.data.go.kr/data/15143513/openapi.do',
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
