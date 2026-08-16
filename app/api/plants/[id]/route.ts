import { getCollectionCardById } from '@/lib/server/collection-cards'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { getForestPlant, getForestPlantByNumber } from '@/lib/server/forest'
import { imageUrl } from '@/lib/server/image'
import { supabase } from '@/lib/server/supabase'
import { userIdFromSession } from '@/lib/server/user'

type ObservationRow = {
  id: string
  image_path: string
  observed_at: string
}

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

    const card = await getCollectionCardById(plantId)
    if (!card) return fail('식물을 찾을 수 없습니다.', 404)

    const forestPlant = card.representativePlantPilbkNo
      ? await getForestPlantByNumber(card.representativePlantPilbkNo)
      : await getForestPlant(card.scientificName)

    const userId = await userIdFromSession()
    let observations: ObservationRow[] = []

    if (userId) {
      const { data: userObservations, error: observationError } = await supabase
        .from('observations')
        .select('id,image_path,observed_at')
        .eq('user_id', userId)
        .order('observed_at', { ascending: false })

      if (observationError) throw observationError
      const rows = (userObservations || []) as ObservationRow[]

      if (rows.length > 0) {
        const { data: matches, error: matchError } = await supabase
          .from('observation_collection_matches')
          .select('observation_id')
          .eq('collection_card_id', card.id)
          .in('observation_id', rows.map((item) => item.id))

        if (matchError) throw matchError
        const matchedIds = new Set(
          (matches || []).map((item) => item.observation_id as string),
        )
        observations = rows.filter((item) => matchedIds.has(item.id))
      }
    }

    return ok({
      plant: {
        id: card.id,
        official: true,
        koreanName: card.displayName,
        scientificName: card.scientificName,
        stage: card.stage,
        rarity: card.rarity,
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
