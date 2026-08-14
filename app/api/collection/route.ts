import { getCollectionCards } from '@/lib/server/collection-cards'
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

type MatchRow = {
  observation_id: string
  collection_card_id: number | null
}

type CountRow = {
  collection_card_id: number
  count: number
}

export async function GET(request: Request) {
  const userId = await userIdFrom(request)
  if (!userId) return fail('로그인이 필요합니다.', 401)

  try {
    const [cards, countResult, observationResult] = await Promise.all([
      getCollectionCards(),
      supabase
        .from('user_collection_counts')
        .select('collection_card_id,count')
        .eq('user_id', userId),
      supabase
        .from('observations')
        .select('id,scientific_name,display_name,image_path,observed_at')
        .eq('user_id', userId)
        .order('observed_at', { ascending: false }),
    ])

    if (countResult.error) throw countResult.error
    if (observationResult.error) throw observationResult.error

    const counts = (countResult.data || []) as CountRow[]
    const observations = (observationResult.data || []) as ObservationRow[]
    let matches: MatchRow[] = []

    if (observations.length > 0) {
      const { data, error } = await supabase
        .from('observation_collection_matches')
        .select('observation_id,collection_card_id')
        .in('observation_id', observations.map((item) => item.id))
      if (error) throw error
      matches = (data || []) as MatchRow[]
    }

    const countByCard = new Map(
      counts.map((item) => [item.collection_card_id, item.count]),
    )
    const matchByObservation = new Map(
      matches.map((item) => [item.observation_id, item.collection_card_id]),
    )
    const observationsByCard = new Map<number, ObservationRow[]>()
    const otherGroups = new Map<string, ObservationRow[]>()

    for (const observation of observations) {
      const cardId = matchByObservation.get(observation.id)
      if (cardId != null) {
        const group = observationsByCard.get(cardId) || []
        group.push(observation)
        observationsByCard.set(cardId, group)
      } else {
        const key = observation.scientific_name.toLowerCase()
        const group = otherGroups.get(key) || []
        group.push(observation)
        otherGroups.set(key, group)
      }
    }

    const collection = cards.map((card) => {
      const cardObservations = observationsByCard.get(card.id) || []
      const latest = cardObservations[0]
      const first = cardObservations[cardObservations.length - 1]
      const count = countByCard.get(card.id) || 0

      return {
        id: card.id,
        koreanName: card.displayName,
        scientificName: card.scientificName,
        stage: card.stage,
        rarity: card.rarity,
        collected: count > 0,
        observationCount: count,
        representativeImageUrl: latest ? imageUrl(latest.image_path) : null,
        firstObservedAt: first?.observed_at || null,
        lastObservedAt: latest?.observed_at || null,
      }
    })

    const others = [...otherGroups.values()].map((group) => {
      const latest = group[0]
      return {
        scientificName: latest.scientific_name,
        displayName: latest.display_name,
        observationCount: group.length,
        representativeImageUrl: imageUrl(latest.image_path),
        lastObservedAt: latest.observed_at,
      }
    })

    const total = cards.length
    const collected = collection.filter((item) => item.collected).length

    return ok({
      summary: {
        total,
        collected,
        totalObservations: observations.length,
        completionRate: total ? Math.round((collected / total) * 100) : 0,
      },
      officialPlants: collection,
      otherFindings: others,
    })
  } catch (error) {
    return fail('도감 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
